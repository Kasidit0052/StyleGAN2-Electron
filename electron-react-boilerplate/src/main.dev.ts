/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { PythonShell } from 'python-shell';
import log from 'electron-log';
import MenuBuilder from './menu';

// Import Related Libraries
const express = require('express');
const _app = express();
const server = require('http').Server(_app);
const io = require('socket.io')(server);
const Store = require('electron-store');
const store = new Store();

// Import Development Libraries
const isDev = require('electron-is-dev');

// On Socketio Client Connected
io.on('connection', (socket) => {
  io.emit('create_new_image');

  // Event on user disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // Pytorch Interface Event Listener
  socket.on('inference image', (msg) => {
    mainWindow.webContents.send('Inference Image', msg);
  });

  // Event for initialize User Interface
  socket.on('Init Interface', (msg) => {
    mainWindow.webContents.send('Init Interface', msg);
  });

});

// Establish a listening server on port 3030
server.listen(3030, () => {
  console.log('listening on *:3030');
});

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1096,
    height: 956,
    minWidth: 1096,
    minHeight: 956,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    mainWindow.webContents.send('Get Python Path', store.get('python_path'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

// Listening Creation Event from Render process
ipcMain.on("creation_event", () => {
  // Send Command through Socketio 
  io.emit('create_new_image');
});

// Listening Modification Event from Render Process
ipcMain.on("modification_event", (event, args) => {
  // Send Command through Socketio 
  io.emit('modify_current_image', args);
});

// Listening Python path initialization event from Render Process
ipcMain.on("pythonpath_init", (event, args) => {
  // Set Python Path in persistant storage
  store.set('python_path', args);
  if (isDev) {
    // Running in Development Mode
    const app_path = app.getAppPath().split("/");
    const base_app_path = app_path.slice(0, app_path.length - 1).join("/");
    const StyleGANPATH = path.join(base_app_path, 'stylegan2_pytorch');
    process.chdir(StyleGANPATH);
    // Running Python Backended Script
    PythonShell.run('socket_inference.py', { scriptPath: StyleGANPATH, pythonPath: store.get('python_path') }, function (err, results) {
      if (err) throw err;
    });
    mainWindow.webContents.send('Init Ready', true);
    console.log('Running in development');
  } else {
    // Running in Production Mode
    const StyleGANPATH = path.join(process.resourcesPath, 'stylegan2_pytorch');
    process.chdir(StyleGANPATH);
    // Running Python Backended Script 
    PythonShell.run('socket_inference.py', { scriptPath: StyleGANPATH, pythonPath: store.get('python_path') }, function (err, results) {
      if (err) throw err;
    });
    mainWindow.webContents.send('Init Ready', true);
    console.log('Running in production');
  }
});

// Second Layer Exception Caughting
process.on('uncaughtException', function (error) {
  mainWindow.webContents.send('Init Ready', false);
});

app.on('window-all-closed', () => {
  app.quit();

});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
