'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const appDir = path.resolve(__dirname, '..');

function mainFixture() {
    const handlers = {}, windowEvents = {}, contentEvents = {};
    const state = {quits: 0};
    const electron = {
        app: {on: (name, fn) => { handlers[name] = fn; }, quit: () => { state.quits++; }},
        ipcMain: {on: (name, fn) => { handlers[name] = fn; }},
        Menu: {buildFromTemplate: value => value, setApplicationMenu: value => { state.menu = value; }},
        BrowserWindow: class {
            constructor(options) {
                state.options = options;
                state.window = this;
                this.webContents = {
                    mainFrame: {url: pathToFileURL(path.join(appDir, 'index.html')).href},
                    on: (name, fn) => { contentEvents[name] = fn; },
                    setWindowOpenHandler: fn => { state.openWindow = fn; },
                };
            }
            loadFile(file) { state.file = file; }
            on(name, fn) { windowEvents[name] = fn; }
        },
    };
    vm.runInNewContext(fs.readFileSync(path.join(appDir, 'main.js'), 'utf8'), {
        require: name => name === 'electron' ? electron : require(name),
        __dirname: appDir, URL,
    });
    handlers.ready();
    return {handlers, windowEvents, contentEvents, state};
}

test('Electron 42 explicitly preserves the local Node renderer and uses supported menu roles', () => {
    const {state} = mainFixture();
    assert.equal(state.options.webPreferences.nodeIntegration, true);
    assert.equal(state.options.webPreferences.contextIsolation, false);
    assert.equal(state.options.webPreferences.sandbox, false);
    assert.equal(state.file, path.join(appDir, 'index.html'));
    assert.equal(state.menu[0].submenu[0].role, 'about');
    for (const item of state.menu[1].submenu) {
        assert.equal(item.selector, undefined);
        if (item.type !== 'separator') assert.ok(item.role);
    }
});

test('only bundled local pages can navigate; popup windows and webviews are blocked', () => {
    const {state, contentEvents} = mainFixture();
    for (const page of ['index.html', 'install.html', 'update.html']) {
        let blocked = false;
        contentEvents['will-navigate']({preventDefault() { blocked = true; }}, pathToFileURL(path.join(appDir, page)).href + '?test=1#fragment');
        assert.equal(blocked, false);
    }
    for (const url of ['https://example.invalid', 'file:///tmp/other.html', 'javascript:alert(1)', 'not a URL']) {
        let blocked = false;
        contentEvents['will-navigate']({preventDefault() { blocked = true; }}, url);
        assert.equal(blocked, true);
    }
    assert.equal(state.openWindow({url: 'https://example.invalid'}).action, 'deny');
    let blocked = false;
    contentEvents['will-attach-webview']({preventDefault() { blocked = true; }});
    assert.equal(blocked, true);
});

test('quit IPC accepts only the local top-level frame and is safe after window close', () => {
    const {state, handlers, windowEvents} = mainFixture();
    const sender = state.window.webContents;
    handlers['app:quit']({sender: {}, senderFrame: sender.mainFrame});
    handlers['app:quit']({sender, senderFrame: {url: sender.mainFrame.url}});
    sender.mainFrame.url = 'https://example.invalid';
    handlers['app:quit']({sender, senderFrame: sender.mainFrame});
    assert.equal(state.quits, 0);
    sender.mainFrame.url = pathToFileURL(path.join(appDir, 'update.html')).href;
    handlers['app:quit']({sender, senderFrame: sender.mainFrame});
    assert.equal(state.quits, 1);
    windowEvents.closed();
    handlers['app:quit']({sender, senderFrame: sender.mainFrame});
    assert.equal(state.quits, 1);
    handlers.activate();
    assert.ok(state.window);
});

test('update page loads version and quits using IPC after a mocked updater callback', () => {
    const handlers = {}, textValues = {}, sent = [], commands = [];
    const jq = element => ({
        on: (event, selector, fn) => { handlers[selector] = fn; },
        ready: fn => fn(),
        text: value => { textValues[element] = value; },
        fadeIn() {},
        removeClass() { return this; }, addClass() { return this; },
    });
    vm.runInNewContext(fs.readFileSync(path.join(appDir, 'update.js'), 'utf8'), {
        require: name => {
            if (name === 'electron') return {ipcRenderer: {send: channel => sent.push(channel)}};
            if (name === './package.json') return {version: '1.1.5'};
            if (name === 'request') return (options, callback) => callback(null, {statusCode: 200}, {version: '1.1.5'});
            if (name === 'child_process') return {exec: (command, callback) => { commands.push(command); callback(null, '', ''); }};
            assert.notEqual(name, 'electron-reload');
            return require(name);
        },
        __dirname: appDir, document: {body: {}}, window: {}, $: jq, jQuery: jq,
        console: {log() {}},
    });
    assert.equal(textValues['#current_version'], '1.1.5');
    assert.equal(textValues['#new_version'], '1.1.5');
    assert.equal(commands.length, 0);
    handlers['.btn.update']();
    assert.equal(commands.length, 1); // Intercepted: no subprocess runs.
    assert.deepEqual(sent, ['app:quit']);
});

test('nested external-link clicks use the anchor URL and reject non-web protocols', () => {
    let click;
    const opened = [];
    const jq = () => ({on: (event, selector, fn) => { click = fn; }});
    vm.runInNewContext(fs.readFileSync(path.join(appDir, 'renderer.js'), 'utf8'), {
        window: {}, $: jq,
        require: name => name === 'jquery' ? jq : name === 'bootstrap' ? {} : {shell: {openExternal: value => opened.push(value)}},
    });
    click({preventDefault() {}, target: {}, currentTarget: {href: 'https://example.invalid/docs'}});
    click({preventDefault() {}, target: {}, currentTarget: {href: 'file:///tmp/untrusted'}});
    assert.deepEqual(opened, ['https://example.invalid/docs']);
});

test('application files no longer use removed remote or selector APIs', () => {
    for (const file of ['main.js', 'index.js', 'renderer.js', 'update.js']) {
        const source = fs.readFileSync(path.join(appDir, file), 'utf8');
        assert.doesNotMatch(source, /require\(['"]electron['"]\)\.remote|remote\.app|selector\s*:/);
        new vm.Script(source, {filename: file});
    }
});
