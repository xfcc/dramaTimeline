const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1120,
    height: 820,
    minWidth: 800,
    minHeight: 560,
    title: "华夏剧典 · 本地编辑",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:5174");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.handle("select-data-dir", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "选择包含 dynasties.json 与 dramas.json 的文件夹",
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle("read-data-files", async (_event, dirPath) => {
  const dynPath = path.join(dirPath, "dynasties.json");
  const dramaPath = path.join(dirPath, "dramas.json");
  const [dynRaw, dramaRaw] = await Promise.all([
    fs.readFile(dynPath, "utf-8"),
    fs.readFile(dramaPath, "utf-8"),
  ]);
  return { dynastiesJson: dynRaw, dramasJson: dramaRaw };
});

ipcMain.handle(
  "write-data-files",
  async (_event, dirPath, dynastiesJson, dramasJson) => {
    const dynPath = path.join(dirPath, "dynasties.json");
    const dramaPath = path.join(dirPath, "dramas.json");
    await fs.writeFile(dynPath, dynastiesJson, "utf-8");
    await fs.writeFile(dramaPath, dramasJson, "utf-8");
    return { ok: true };
  },
);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
