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

  // Security: Disable X-Powered-By header and set standard privacy/security headers
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // In-memory rate limiter to mitigate DoS/brute-force attacks
  const rateLimitBuckets: Record<string, { count: number; resetTime: number }> = {};
  function createRateLimiter(maxRequests: number, windowMs: number) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const bucket = rateLimitBuckets[ip];

      if (!bucket || now > bucket.resetTime) {
        rateLimitBuckets[ip] = { count: 1, resetTime: now + windowMs };
        return next();
      }

      if (bucket.count >= maxRequests) {
        return res.status(429).json({ error: "Too many requests, please try again later." });
      }

      bucket.count++;
      next();
    };
  }

  const feedbackRateLimiter = createRateLimiter(15, 60 * 1000); // 15 requests per minute
  const publishRateLimiter = createRateLimiter(5, 60 * 1000);   // 5 requests per minute

  // Segmented Body Parsing: Optional /api/publish endpoint for CI/CD updates (isolated 15mb limit)
  app.post("/api/publish", publishRateLimiter, express.json({ limit: '15mb' }), async (req, res) => {
    const authHeader = req.headers.authorization;
    const secret = process.env.PUBLISH_SECRET;
    
    if (!secret) {
      return res.status(503).json({ error: "Publishing disabled: PUBLISH_SECRET is not configured on the server." });
    }

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return res.status(401).json({ error: "Unauthorized. Safe publish requires correct token." });
    }

    const { zipBase64, crxBase64 } = req.body;
    if (!zipBase64 && !crxBase64) return res.status(400).json({ error: "No ZIP or CRX data" });
    
    try {
      if (zipBase64) {
        const buffer = Buffer.from(zipBase64, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.zip'), buffer);
        fs.writeFileSync(path.join(process.cwd(), 'SyncRate.zip'), buffer);
      }
      if (crxBase64) {
        const buffer = Buffer.from(crxBase64, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.crx'), buffer);
      } else if (zipBase64) {
        const buffer = Buffer.from(zipBase64, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.crx'), buffer);
      }

      console.log("🚀 Successfully refreshed SyncRate extension assets on disk!");
      res.json({ success: true, message: "SyncRate binaries published successfully." });
    } catch (fsErr) {
      console.error("Failed to write extension binaries:", fsErr);
      res.status(500).json({ error: "Publish failed." });
    }
  });

  // Safe global JSON parsing middleware (100kb limit)
  app.use(express.json({ limit: '100kb' }));

  // Helper to safely escape strings for XML attributes
  function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Update Manifest for Chrome
  app.get("/updates.xml", (req, res) => {
    res.set("Content-Type", "application/xml; charset=utf-8");
    const rawAppUrl = (process.env.APP_URL || "").replace(/\/$/, "");
    const safeCodebase = escapeXml(`${rawAppUrl}/SyncRate.crx`);
    res.send(`<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/updateflash/statustext/1.0' protocol='2.0'>
  <app appid='msjrecxeaytix2n65pvx6i'>
    <updatecheck codebase='${safeCodebase}' version='1.0.0' />
  </app>
</gupdate>`);
  });

  // Version info
  app.get("/version.json", (req, res) => {
    res.json({
      version: "1.0.0",
      notes: "Open Source Edition: Added National Banks and Top-30 Crypto support. Fully free, private, and open-source.",
      date: "2026-03-31"
    });
  });

  // Direct routes for ZIP/CRX downloads from local disk
  app.get("/SyncRate.zip", (req, res) => {
    const publicPath = path.join(process.cwd(), "public", "SyncRate.zip");
    const rootPath = path.join(process.cwd(), "SyncRate.zip");
    const targetPath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(rootPath) ? rootPath : null);

    if (targetPath) {
      res.set("Content-Type", "application/zip");
      res.set("Content-Disposition", 'attachment; filename="SyncRate.zip"');
      return res.sendFile(targetPath);
    }
    return res.status(404).send("File not found");
  });

  app.get("/SyncRate.crx", (req, res) => {
    const publicCrx = path.join(process.cwd(), "public", "SyncRate.crx");
    const publicZip = path.join(process.cwd(), "public", "SyncRate.zip");
    const rootZip = path.join(process.cwd(), "SyncRate.zip");

    if (fs.existsSync(publicCrx)) {
      res.set("Content-Type", "application/x-chrome-extension");
      res.set("Content-Disposition", 'attachment; filename="SyncRate.crx"');
      return res.sendFile(publicCrx);
    }
    const fallbackZip = fs.existsSync(publicZip) ? publicZip : (fs.existsSync(rootZip) ? rootZip : null);
    if (fallbackZip) {
      res.set("Content-Type", "application/x-chrome-extension");
      res.set("Content-Disposition", 'attachment; filename="SyncRate.crx"');
      return res.sendFile(fallbackZip);
    }
    return res.status(404).send("File not found");
  });

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Community Feedback handler: fully validated, zero database persistence for complete user privacy
  app.post("/api/feedback", feedbackRateLimiter, (req, res) => {
    try {
      const { name, email, text, stars } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Feedback text is required and cannot be empty." });
      }

      if (text.length > 2000) {
        return res.status(400).json({ success: false, error: "Feedback text is too long (maximum 2000 characters)." });
      }

      if (typeof email === "string" && email.trim().length > 0) {
        const trimmedEmail = email.trim().slice(0, 120);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ success: false, error: "Please provide a valid email address." });
        }
      }

      // Safe processing: No user data or emails are stored in any external database
      res.json({ success: true, message: "Thank you for your feedback!" });
    } catch (err) {
      console.error("Error handling feedback:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
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
