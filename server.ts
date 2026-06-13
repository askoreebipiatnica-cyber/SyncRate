import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Middleware to parse JSON
  app.use(express.json({ limit: '10mb' }));

  // Update Manifest for Chrome
  app.get("/updates.xml", (req, res) => {
    res.set("Content-Type", "application/xml");
    const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
    res.send(`<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/updateflash/statustext/1.0' protocol='2.0'>
  <app appid='msjrecxeaytix2n65pvx6i'>
    <updatecheck codebase='${appUrl}/SyncRate.crx' version='15.0' />
  </app>
</gupdate>`);
  });

  // Version info for manual check
  app.get("/version.json", (req, res) => {
    res.json({
      version: "15.0",
      notes: "Enterprise Edition: Added National Banks and Top-30 Crypto support.",
      date: "2026-03-31"
    });
  });

  // Route to "publish" the ZIP/CRX (for demo purposes)
  app.post("/api/publish", (req, res) => {
    const authHeader = req.headers.authorization;
    const secret = process.env.PUBLISH_SECRET;
    
    if (!secret && process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "PUBLISH_SECRET is not configured on the server." });
    }

    const expectedSecret = secret || "default_syncrate_secret_12345";
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: "Unauthorized. Safe publish requires correct token." });
    }

    const { zipBase64, crxBase64 } = req.body;
    if (!zipBase64 && !crxBase64) return res.status(400).json({ error: "No ZIP or CRX data" });
    
    try {
      if (zipBase64) {
        const buffer = Buffer.from(zipBase64, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.zip'), buffer);
      }
      if (crxBase64) {
        const buffer = Buffer.from(crxBase64, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.crx'), buffer);
      } else if (zipBase64) {
        // Fallback: write zip bytes to .crx file as well for testing integration
        const buffer = Buffer.from(zipBase64, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.crx'), buffer);
      }
      res.json({ success: true, message: "Extension published successfully as CRX and ZIP!" });
    } catch (err) {
      res.status(500).json({ error: "Failed to save published files" });
    }
  });

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Serve static files from public
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
