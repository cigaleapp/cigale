const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativeWindow', {
	/**
	 * @param {number} value
	 * @returns
	 */
	setProgress: (value) => ipcRenderer.send('progressBar:set', value === 1 ? 0 : value),
	startCallingAttention: () => ipcRenderer.send('nativeWindow:startCallingAttention'),
	stopCallingAttention: () => ipcRenderer.send('nativeWindow:stopCallingAttention')
});
