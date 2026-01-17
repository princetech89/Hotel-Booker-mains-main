import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    // a bit of a hack to make it work locally
    const localPath = path.resolve(process.cwd(), "dist/public");
    if (!fs.existsSync(localPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }
    app.use(express.static(localPath));
    app.use("/{*path}", (_req, res) => {
      res.sendFile(path.resolve(localPath, "index.html"));
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
