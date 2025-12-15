import os from 'node:os';
import path from 'node:path';
import { app, BrowserWindow, ipcMain, session } from 'electron';
import serve from 'electron-serve';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';

/* global MAIN_WINDOW_VITE_DEV_SERVER_URL */
const builtFileserver = serve({ directory: path.join(import.meta.dirname, 'sveltekit') });

try {
	updateElectronApp();
} catch (error) {
	console.error('Failed to update Electron app:', error);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

const isLinux = ['freebsd', 'linux', 'openbsd', 'haiku', 'sunos'].includes(process.platform);

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		icon: isLinux ? path.join(import.meta.dirname, 'icon.png') : undefined,
		width: 1200,
		minWidth: 1000,
		height: 800,
		minHeight: 500,
		titleBarStyle: 'hidden',
		// Make title bar overlay background transparent
		titleBarOverlay: process.platform !== 'darwin' ? { color: '#0000' } : undefined,
		webPreferences: {
			preload: path.join(import.meta.dirname, 'preload.js')
		}
	});

	ipcMain.on('progressBar:set', (_event, /** @type {number} */ value) => {
		mainWindow.setProgressBar(value);
	});

	ipcMain.on('nativeWindow:startCallingAttention', () => {
		mainWindow.flashFrame(true);
	});

	ipcMain.on('nativeWindow:stopCallingAttention', () => {
		mainWindow.flashFrame(false);
	});

	ipcMain.on('nativeWindow:setControlsColor', (_event, /** @type {string} */ color) => {
		if (process.platform === 'darwin') return;
		try {
			mainWindow.setTitleBarOverlay({ symbolColor: color });
		} catch (error) {
			console.error(error);
		}
	});

	ipcMain.on('nativeWindow:setControlsHeight', (_event, /** @type {number} */ height) => {
		if (process.platform === 'darwin') return;
		mainWindow.setTitleBarOverlay({ height });
	});

	/** @type {Partial<Record<NodeJS.Platform, string[]>>} */
	const usualArchs = {
		win32: ['x64'],
		darwin: ['arm64', 'x64'],
		linux: ['x64']
	};

	ipcMain.handle('osinfo', () => ({
		name: os.type().replace('Windows_NT', 'Windows').replace('Darwin', 'macOS'),
		version: os.release(),
		architecture: os.arch(),
		archIsUnusual: !usualArchs[os.platform()]?.includes(os.arch()),
		serviceWorkers: Object.values(session.defaultSession.serviceWorkers.getAllRunning()).map(
			(sw) => sw.scriptUrl
		)
	}));

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
		mainWindow.webContents.on('did-frame-finish-load', () => {
			mainWindow.webContents.openDevTools({ mode: 'detach' });
		});
	} else {
		// mainWindow.loadFile(path.join(import.meta.dirname, 'index.html'));
		builtFileserver(mainWindow);
	}
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
