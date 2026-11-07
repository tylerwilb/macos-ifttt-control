'use strict';

// Offline checks only. This never loads the app or calls a webhook/service.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const plist = require('plist');
const expand = require('brace-expansion');

assert.deepStrictEqual(expand('app/{main,renderer}.js'), ['app/main.js', 'app/renderer.js']);
assert.deepStrictEqual(expand('{1..3}'), ['1', '2', '3']);
const bundle = {
    CFBundleName: 'macOS IFTTT Control',
    CFBundleShortVersionString: '1.1.5',
    LSUIElement: false,
    TestValues: ['one', 'two'],
};
assert.deepStrictEqual(plist.parse(plist.build(bundle)), bundle);
const daemon = fs.readFileSync(path.join(__dirname, '../cli/daemon/co.abdyfran.macosiftttcontrol.plist'), 'utf8');
const parsed = plist.parse(daemon);
assert.strictEqual(parsed.Label, 'co.abdyfran.macosiftttcontrol');
assert.deepStrictEqual(plist.parse(plist.build(parsed)), parsed);
console.log('Offline brace expansion and plist packaging checks passed.');
