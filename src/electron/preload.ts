const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
	node: () => process.versions.node,
	chrome: () => process.versions.chrome,
	electron: () => process.versions.electron,
	os: async () => ipcRenderer.invoke('osinfo')
});

contextBridge.exposeInMainWorld('nativeWindow', {
	/** @param {number} value */
	setProgress: (value) => ipcRenderer.send('progressBar:set', value === 1 ? 0 : value),
	startCallingAttention: () => ipcRenderer.send('nativeWindow:startCallingAttention'),
	stopCallingAttention: () => ipcRenderer.send('nativeWindow:stopCallingAttention'),
	/** @param {string} color */
	setControlsColor: (color) => ipcRenderer.send('nativeWindow:setControlsColor', color),
	/** @param {number} height */
	setControlsHeight: (height) => ipcRenderer.send('nativeWindow:setControlsHeight', height)
});
