import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import serve from 'electron-serve';

const builtFileserver = serve({ directory: import.meta.dirname });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

Menu.setApplicationMenu(null);

const createWindow = () => {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		titleBarStyle: 'hidden',
		...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
		webPreferences: {
			preload: path.join(import.meta.dirname, 'preload.js'),
			webSecurity: false
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
