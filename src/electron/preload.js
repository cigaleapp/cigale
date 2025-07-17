const { contextBridge, ipcRenderer } = require('electron');
const os = require('node:os');

/** @type {Partial<Record<NodeJS.Platform, string[]>>} */
const usualArchs = {
	win32: ['x64'],
	darwin: ['arm64', 'x64'],
	linux: ['x64']
};

contextBridge.exposeInMainWorld('versions', {
	node: () => process.versions.node,
	chrome: () => process.versions.chrome,
	electron: () => process.versions.electron,
	os: () => ({
		name: os.type().replace('Windows_NT', 'Windows').replace('Darwin', 'macOS'),
		version: os.release(),
		architecture: os.arch(),
		archIsUnusual: usualArchs[os.platform()]?.includes(os.arch()) ?? true
	})
});

contextBridge.exposeInMainWorld('nativeWindow', {
	/**
	 * @param {number} value
	 * @returns
	 */
	setProgress: (value) => ipcRenderer.send('progressBar:set', value === 1 ? 0 : value),
	startCallingAttention: () => ipcRenderer.send('nativeWindow:startCallingAttention'),
	stopCallingAttention: () => ipcRenderer.send('nativeWindow:stopCallingAttention')
});
