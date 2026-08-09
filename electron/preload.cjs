const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  name: 'islamic-pedia',
  platform: process.platform,
});
