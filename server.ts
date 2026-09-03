import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Security: Disable X-Powered-By header and set standard security headers
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

  // Initialize Firebase Firestore for database persistence of binary files and feedback
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let firestoreDatabaseId = process.env.FIREBASE_DATABASE_ID;

  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      projectId = projectId || firebaseConfig.projectId;
      firestoreDatabaseId = firestoreDatabaseId || firebaseConfig.firestoreDatabaseId;
    } catch (e) {
      console.warn("Failed to read firebase-applet-config.json, using env variables:", e);
    }
  }

  let rawAdminDb = null;
  if (!projectId) {
    console.warn("⚠️ WARNING: Firebase projectId is not configured. Falling back to IN-MEMORY database mode.");
  } else {
    try {
      if (getAdminApps().length === 0) {
        initAdminApp({
          projectId: projectId
        });
      }
      rawAdminDb = getAdminFirestore(firestoreDatabaseId || undefined);
      console.log("🚀 Firebase Admin SDK initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize Firebase Admin SDK, falling back to IN-MEMORY mode:", e);
      rawAdminDb = null;
    }
  }

  // Robust, self-contained transparent in-memory fallback for Firestore database operations
  const memoryStore: Record<string, Record<string, any>> = {
    files: {},
    feedbacks: {}
  };

  class FallbackDocRef {
    constructor(private collectionName: string, private docId: string, private realDocRef: any) {}

    async set(data: any, options?: any) {
      if (this.realDocRef) {
        try {
          return await this.realDocRef.set(data, options);
        } catch (e) {
          console.warn(`[Firestore Fallback] set failed for ${this.collectionName}/${this.docId}, falling back to memory:`, e);
        }
      }
      memoryStore[this.collectionName] = memoryStore[this.collectionName] || {};
      memoryStore[this.collectionName][this.docId] = { ...data };
    }

    async get() {
      if (this.realDocRef) {
        try {
          const snap = await this.realDocRef.get();
          snap.data(); // Trigger potential lazy gRPC permission errors early
          return snap;
        } catch (e) {
          console.warn(`[Firestore Fallback] get failed for ${this.collectionName}/${this.docId}, falling back to memory:`, e);
        }
      }
      const data = memoryStore[this.collectionName]?.[this.docId] || null;
      return {
        exists: !!data,
        data: () => data,
        id: this.docId
      };
    }
  }

  class FallbackCollectionRef {
    constructor(private collectionName: string, private realCollectionRef: any) {}

    doc(docId: string) {
      const realDoc = this.realCollectionRef ? this.realCollectionRef.doc(docId) : null;
      return new FallbackDocRef(this.collectionName, docId, realDoc);
    }

    async add(data: any) {
      if (this.realCollectionRef) {
        try {
          return await this.realCollectionRef.add(data);
        } catch (e) {
          console.warn(`[Firestore Fallback] add failed for ${this.collectionName}, falling back to memory:`, e);
        }
      }
      const docId = "doc_" + Math.random().toString(36).substring(2, 15);
      memoryStore[this.collectionName] = memoryStore[this.collectionName] || {};
      memoryStore[this.collectionName][docId] = { ...data };
      return { id: docId };
    }
  }

  class FallbackFirestore {
    constructor(private realDb: any) {}

    collection(collectionName: string) {
      const realCollection = this.realDb ? this.realDb.collection(collectionName) : null;
      return new FallbackCollectionRef(collectionName, realCollection);
    }
  }

  const adminDb = new FallbackFirestore(rawAdminDb);

  // Unified Database Service Wrapper
  const dbService = {
    async saveFile(filename: string, base64Data: string): Promise<void> {
      await adminDb.collection("files").doc(filename).set({
        filename,
        base64Data,
        updatedAt: new Date().toISOString()
      });
    },

    async getFile(filename: string): Promise<string | null> {
      const docSnap = await adminDb.collection("files").doc(filename).get();
      if (docSnap.exists) {
        return docSnap.data()?.base64Data || null;
      }
      return null;
    }
  };

  // Segmented Body Parsing: Register /api/publish first with custom isolated middleware (up to 15mb)
  app.post("/api/publish", publishRateLimiter, express.json({ limit: '15mb' }), async (req, res) => {
    const authHeader = req.headers.authorization;
    const secret = process.env.PUBLISH_SECRET;
    
    // Security: Refuse publishing if server secret is not configured
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
        await dbService.saveFile("SyncRate.zip", zipBase64);
      }
      if (crxBase64) {
        await dbService.saveFile("SyncRate.crx", crxBase64);
      } else if (zipBase64) {
        await dbService.saveFile("SyncRate.crx", zipBase64);
      }

      try {
        if (zipBase64) {
          const buffer = Buffer.from(zipBase64, 'base64');
          fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.zip'), buffer);
        }
        if (crxBase64) {
          const buffer = Buffer.from(crxBase64, 'base64');
          fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.crx'), buffer);
        } else if (zipBase64) {
          const buffer = Buffer.from(zipBase64, 'base64');
          fs.writeFileSync(path.join(process.cwd(), 'public', 'SyncRate.crx'), buffer);
        }
      } catch (localFsErr) {
        console.warn("Best-effort local file write bypassed:", localFsErr);
      }

      console.log("🚀 Successfully refreshed SyncRate extension assets inside memory/persistent store!");
      res.json({ success: true, message: "SyncRate binaries published successfully." });
    } catch (dbErr) {
      console.error("Failed to commit modern binaries:", dbErr);
      res.status(500).json({ error: "Persistent publish failed." });
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
      notes: "Open Source Edition: Added National Banks and Top-30 Crypto support. Fully free and open-source.",
      date: "2026-03-31"
    });
  });

  // Dynamic routes for ZIP/CRX downloads from Cloud Firestore with local disk fallback
  app.get("/SyncRate.zip", async (req, res) => {
    try {
      const base64 = await dbService.getFile("SyncRate.zip");
      if (base64) {
        const buffer = Buffer.from(base64, "base64");
        res.set("Content-Type", "application/zip");
        res.set("Content-Disposition", 'attachment; filename="SyncRate.zip"');
        return res.send(buffer);
      }
    } catch (err) {
      console.error("Failed to fetch SyncRate.zip from Firestore:", err);
    }
    const localPath = path.join(process.cwd(), "public", "SyncRate.zip");
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }
    return res.status(404).send("File not found");
  });

  app.get("/SyncRate.crx", async (req, res) => {
    try {
      const base64 = await dbService.getFile("SyncRate.crx");
      if (base64) {
        const buffer = Buffer.from(base64, "base64");
        res.set("Content-Type", "application/x-chrome-extension");
        res.set("Content-Disposition", 'attachment; filename="SyncRate.crx"');
        return res.send(buffer);
      }
    } catch (err) {
      console.error("Failed to fetch SyncRate.crx from Firestore:", err);
    }
    const localPath = path.join(process.cwd(), "public", "SyncRate.crx");
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }
    return res.status(404).send("File not found");
  });

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Feedback form handler with rate-limiting and robust input validation
  app.post("/api/feedback", feedbackRateLimiter, async (req, res) => {
    try {
      const { name, email, text, stars } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Feedback text is required and cannot be empty." });
      }

      if (text.length > 2000) {
        return res.status(400).json({ success: false, error: "Feedback text is too long (maximum 2000 characters)." });
      }

      const cleanName = (typeof name === "string" ? name.trim().slice(0, 100) : "") || "Anonymous";
      
      let cleanEmail = "anonymous@syncrate.org";
      if (typeof email === "string" && email.trim().length > 0) {
        const trimmedEmail = email.trim().slice(0, 120);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ success: false, error: "Please provide a valid email address." });
        }
        cleanEmail = trimmedEmail;
      }

      const numStars = Number(stars);
      const cleanStars = (!isNaN(numStars) && numStars >= 1 && numStars <= 5) ? Math.floor(numStars) : 5;

      await adminDb.collection("feedbacks").add({
        name: cleanName,
        email: cleanEmail,
        text: text.trim(),
        stars: cleanStars,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true, message: "Thank you for your feedback!" });
    } catch (err) {
      console.error("Error saving feedback:", err);
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
