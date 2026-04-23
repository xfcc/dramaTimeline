const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dramaEdit", {
  selectDataDir: () => ipcRenderer.invoke("select-data-dir"),
  readDataFiles: (dirPath) => ipcRenderer.invoke("read-data-files", dirPath),
  writeDataFiles: (dirPath, dynastiesJson, dramasJson) =>
    ipcRenderer.invoke("write-data-files", dirPath, dynastiesJson, dramasJson),
});
