// This is just the default loader.
// You can customize it however you want, it will not be overwritten once it exists and is not empty.

import { registerLoaders } from 'wuchale/load-utils';

import { loadCatalog, loadIDs } from './.wuchale/js.proxy.js';

const key = 'js';

// two exports. can be used anywhere
export const getRuntime = registerLoaders(key, loadCatalog, loadIDs);
export const getRuntimeRx = getRuntime;
