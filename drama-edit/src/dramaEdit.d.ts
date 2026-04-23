export {};

declare global {
  interface Window {
    dramaEdit: {
      selectDataDir: () => Promise<string | null>;
      readDataFiles: (dirPath: string) => Promise<{
        dynastiesJson: string;
        dramasJson: string;
      }>;
      writeDataFiles: (
        dirPath: string,
        dynastiesJson: string,
        dramasJson: string,
      ) => Promise<{ ok: boolean }>;
    };
  }
}
