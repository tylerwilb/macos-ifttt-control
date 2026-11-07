// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const Menu = require('electron').Menu
const {pathToFileURL} = require('url')

const localPages = new Set(['index.html', 'install.html', 'update.html'].map(
    file => pathToFileURL(path.join(__dirname, file)).href
))

function isLocalPage(url) {
    try {
        const page = new URL(url)
        page.hash = ''
        page.search = ''
        return localPages.has(page.href)
    } catch (_) {
        return false
    }
}

// Only the app's own top-level local page may request a quit.
ipcMain.on('app:quit', event => {
    if (mainWindow && event.sender === mainWindow.webContents &&
        event.senderFrame === mainWindow.webContents.mainFrame &&
        isLocalPage(event.senderFrame.url)) {
        app.quit()
    }
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 950,
        height: 700,
        minHeight: 480,
        minWidth: 700,
        webPreferences: {
            // These trusted local pages still use CommonJS and Node APIs.
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false
        },
        icon: path.join(__dirname, '/assets/icon.png')
    })

    // and load the index.html of the app.
    mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!isLocalPage(url)) event.preventDefault()
    })
    mainWindow.webContents.on('will-attach-webview', event => event.preventDefault())
    mainWindow.loadFile(path.join(__dirname, 'index.html'))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    createMenu()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//require('electron-debug')({showDevTools: true, enabled: true});

function createMenu() {
    const application = {
        label: "Application",
        submenu: [
            {
                label: "About macOS IFTTT Control",
                role: "about"
            },
            {
                type: "separator"
            },
            {
                label: "Quit",
                accelerator: "Command+Q",
                click: () => {
                    app.quit()
                }
            }
        ]
    }

    const edit = {
        label: "Edit",
        submenu: [
            {
                label: "Undo",
                accelerator: "CmdOrCtrl+Z",
                role: "undo"
            },
            {
                label: "Redo",
                accelerator: "Shift+CmdOrCtrl+Z",
                role: "redo"
            },
            {
                type: "separator"
            },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+X",
                role: "cut"
            },
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+C",
                role: "copy"
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+V",
                role: "paste"
            },
            {
                label: "Select All",
                accelerator: "CmdOrCtrl+A",
                role: "selectAll"
            }
        ]
    }

    const template = [
        application,
        edit
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
