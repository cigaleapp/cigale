// This is just the default loader.
// You can customize it however you want, it will not be overwritten once it exists and is not empty.

import { currentRuntime } from 'wuchale/load-utils/server';

import { loadCatalog, loadIDs } from './.wuchale/js.proxy.sync.js';

export const key = 'js';
export { loadCatalog, loadIDs }; // for loading before runWithLocale

// two exports, same function
export const getRuntime = (/** @type {string} */ loadID) => currentRuntime(key, loadID);
export const getRuntimeRx = getRuntime;
