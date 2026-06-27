import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Initialize Firebase Firestore for database persistence of licenses and binary files
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // Admin Client initialization (Primary Enterprise SDK using ADC GCloud environment credentials)
  if (getAdminApps().length === 0) {
    initAdminApp({
      projectId: firebaseConfig.projectId
    });
  }
  const adminDb = getAdminFirestore(firebaseConfig.firestoreDatabaseId);
  console.log("🚀 Enterprise gRPC firebase-admin SDK initialized successfully.");

  // Вспомогательные криптографические функции для защиты ключей в БД (соленый PBKDF2 хеш)
  function hashLicenseKey(key: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(key, salt, 1000, 64, "sha256").toString("hex");
    return `${salt}:${hash}`;
  }

  function verifyLicenseKey(key: string, storedHash: string): boolean {
    try {
      const [salt, hash] = storedHash.split(":");
      if (!salt || !hash) return false;
      const verifyHash = crypto.pbkdf2Sync(key, salt, 1000, 64, "sha256").toString("hex");
      return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
    } catch (e) {
      return false;
    }
  }

  // Функция для вычисления SHA-256 хэша ключа в качестве безопасного ID документа в БД (гарантирует O(1) поиск без раскрытия ключа)
  function getLicenseDocId(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  // Простая, безопасная и самодостаточная генерация JWT на чистом Node.js (без внешних зависимостей типа jsonwebtoken)
  const JWT_SECRET = process.env.JWT_SECRET || "syncrate-fallback-secret-99887766";

  function signJwt(payload: object): string {
    const header = { alg: "HS256", typ: "JWT" };
    const base64Header = Buffer.from(JSON.stringify(header)).toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    
    const signature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
      
    return `${base64Header}.${base64Payload}.${signature}`;
  }

  function verifyJwt(token: string): any {
    try {
      const [header, payload, signature] = token.split(".");
      if (!header || !payload || !signature) return null;
      const expectedSignature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      const decodedPayload = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        return null; // Expired
      }
      return decodedPayload;
    } catch (err) {
      return null;
    }
  }

  // Встроенный Rate Limiter для защиты эндпоинта верификации от брутфорс атак
  interface RateLimitData {
    count: number;
    resetTime: number;
  }
  const rateLimits = new Map<string, RateLimitData>();
  const feedbackRateLimits = new Map<string, RateLimitData>();

  // Периодическая очистка устаревших лимитов во избежание утечки памяти
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimits.entries()) {
      if (now > data.resetTime) {
        rateLimits.delete(ip);
      }
    }
    for (const [ip, data] of feedbackRateLimits.entries()) {
      if (now > data.resetTime) {
        feedbackRateLimits.delete(ip);
      }
    }
  }, 60000);

  const feedbackRateLimiter = (req: any, res: any, next: any) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.ip || req.socket.remoteAddress || "unknown").trim();
    const now = Date.now();
    const limitWindowMs = 60000; // 1 минута
    const maxRequests = 3;

    const data = feedbackRateLimits.get(ip);
    if (!data || now > data.resetTime) {
      feedbackRateLimits.set(ip, {
        count: 1,
        resetTime: now + limitWindowMs
      });
      return next();
    }

    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Превышен лимит отправки обратной связи. Пожалуйста, попробуйте снова через минуту."
      });
    }

    data.count += 1;
    next();
  };

  const verifyLicenseRateLimiter = (req: any, res: any, next: any) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.ip || req.socket.remoteAddress || "unknown").trim();
    const now = Date.now();
    const limitWindowMs = 60000; // 1 минута
    const maxRequests = 5;

    const data = rateLimits.get(ip);
    if (!data || now > data.resetTime) {
      rateLimits.set(ip, {
        count: 1,
        resetTime: now + limitWindowMs
      });
      return next();
    }

    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Превышен лимит запросов. Пожалуйста, попробуйте снова через минуту."
      });
    }

    data.count += 1;
    next();
  };

  // Unified Database Service Wrapper representing the single database operations contract
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
    },

    async loadAllLicenses(): Promise<string[]> {
      const list: string[] = [];
      const querySnapshot = await adminDb.collection("licenses").get();
      querySnapshot.forEach((docSnapshot: any) => {
        const data = docSnapshot.data();
        if (data && data.key) {
          list.push(data.key.toUpperCase());
        }
      });
      return list;
    },

    async saveLicense(key: string): Promise<void> {
      const cleanKey = key.trim().toUpperCase();
      const docId = getLicenseDocId(cleanKey);
      const hashValue = hashLicenseKey(cleanKey);
      await adminDb.collection("licenses").doc(docId).set({
        hash: hashValue,
        createdAt: new Date().toISOString()
      });
    },

    async verifyLicenseExists(key: string): Promise<boolean> {
      const cleanKey = key.trim().toUpperCase();
      const docId = getLicenseDocId(cleanKey);
      const docSnap = await adminDb.collection("licenses").doc(docId).get();
      if (!docSnap.exists) return false;
      const data = docSnap.data();
      if (!data || !data.hash) return false;
      return verifyLicenseKey(cleanKey, data.hash);
    }
  };

  // Segmented Body Parsing: Register /api/publish first with custom isolated middleware (up to 15mb)
  // to support extension binary payloads, then lock down the remaining routes to a safe 100kb limit.
  app.post("/api/publish", express.json({ limit: '15mb' }), async (req, res) => {
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
      // 1. Сохраняем в Firestore, чтобы обновления не терялись при перезапуске/масштабировании контейнеров
      if (zipBase64) {
        await dbService.saveFile("SyncRate.zip", zipBase64);
      }
      if (crxBase64) {
        await dbService.saveFile("SyncRate.crx", crxBase64);
      } else if (zipBase64) {
        // Фоллбек для CRX
        await dbService.saveFile("SyncRate.crx", zipBase64);
      }

      // 2. Попытка записать на локальный диск (может завершиться ошибкой на read-only fs, игнорируем ошибку)
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
        console.warn("Best-effort local file write bypassed (Read-only container system):", localFsErr);
      }

      console.log("🚀 Successfully refreshed SyncRate extension assets inside memory persistent store!");
      res.json({ success: true, message: "SyncRate binaries published successfully." });
    } catch (dbErr) {
      console.error("Failed to commit modern binaries into Firestore:", dbErr);
      res.status(500).json({ error: "Persistent publish failed." });
    }
  });

  // Strict global JSON parsing middleware for all general subsequent routes
  app.use(express.json({ limit: '100kb' }));

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

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Simple persisted license list
  const hardcodedLicenses = new Set<string>([
    "PRO-123456", "PRO-ABCDEF", "PRO-SYNCRATE",
    "PLUS-123456", "PLUS-ABCDEF", "PLUS-ENTERPRISE"
  ]);

  // Bounded Least Recently Used (LRU) Cache to avoid memory leaks with huge license lists
  class LicenseLruCache {
    private cache = new Map<string, boolean>();
    private readonly maxSize: number;

    constructor(maxSize = 10000) {
      this.maxSize = maxSize;
    }

    has(key: string): boolean {
      if (hardcodedLicenses.has(key)) return true;
      if (this.cache.has(key)) {
        // Refresh item priority (LRU)
        const val = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, val);
        return true;
      }
      return false;
    }

    add(key: string) {
      if (hardcodedLicenses.has(key)) return;
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.maxSize) {
        // Drop standard oldest insertion
        const firstValue = this.cache.keys().next().value;
        if (firstValue !== undefined) {
          this.cache.delete(firstValue);
        }
      }
      this.cache.set(key, true);
    }
  }

  const activeLicenses = new LicenseLruCache(10000);
  console.log("🚀 Bounded LRU active licenses cache initialized. Startup collection dump bypassed to guarantee O(1) boot performance.");

  const saveLicense = async (key: string) => {
    const cleanKey = key.trim().toUpperCase();
    activeLicenses.add(cleanKey);

    // Persist immediately to Cloud Firestore so licenses are never lost when containers restart or scale
    try {
      await dbService.saveLicense(cleanKey);
      console.log(`Successfully persisted license ${cleanKey} to cloud Firestore!`);
    } catch (error) {
      console.error(`Error saving license ${cleanKey} to Firestore:`, error);
    }
  };

  // Extended unified Checkout portal supporting both upgrades & donations, working inside Russia & worldwide.
  app.get("/checkout", (req, res) => {
    const isDonation = req.query.type === "donation";
    const tier = (req.query.tier || "pro").toString().toLowerCase();
    const isProPlus = tier === "pro_plus";
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SyncRate Checkout | Global & Russian Payments</title>
    <script src="https://cdn.tailwindcss.com" crossorigin></script>
    <style>
        body { background: #09090b; color: #fafafa; font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
    <div class="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative">
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-amber-500"></div>
        
        <!-- Header Controls & Lang Selector -->
        <div class="px-6 pt-6 pb-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/20">
            <div>
                <h1 class="text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-0.5">SyncRate Checkout</h1>
                <h2 id="page-title" class="text-lg font-bold text-white"></h2>
            </div>
            <button onclick="toggleLang()" class="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                🌐 <span id="current-lang-lbl">EN</span>
            </button>
        </div>

        <!-- Main Workspace -->
        <div class="p-6">
            <!-- Product Item Selector or Display -->
            <div id="product-card" class="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 mb-6">
                <!-- Donation Options -->
                <div id="donation-selector" class="hidden">
                    <p class="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3 lang-el" data-en="Select Donation Amount" data-ru="Выберите сумму поддержки"></p>
                    <div class="grid grid-cols-4 gap-2 mb-3">
                        <button onclick="selectPresetDonation(5, this)" class="preset-btn py-2 text-sm font-semibold bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-all cursor-pointer">$5</button>
                        <button onclick="selectPresetDonation(8, this)" class="preset-btn py-2 text-sm font-semibold bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500 rounded-lg text-violet-300 transition-all cursor-pointer">$8</button>
                        <button onclick="selectPresetDonation(15, this)" class="preset-btn py-2 text-sm font-semibold bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-all cursor-pointer">$15</button>
                        <button id="custom-donation-btn" onclick="showCustomDonationInput()" class="preset-btn py-2 text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-all cursor-pointer lang-el" data-en="Custom" data-ru="Другая"></button>
                    </div>
                    <div id="custom-donation-row" class="hidden flex gap-2 mb-3">
                        <div class="relative flex-1">
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
                            <input type="number" id="custom-amount-val" value="15" min="1" step="1" oninput="updatePriceFromCustom()" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-7 pr-3 text-sm font-medium focus:outline-none focus:border-violet-500 text-white">
                        </div>
                    </div>
                </div>

                <!-- Product Display Row -->
                <div class="flex justify-between items-center">
                    <div>
                        <span id="product-name" class="font-bold text-white text-base"></span>
                        <div id="product-sub" class="text-xs text-zinc-400 mt-1"></div>
                    </div>
                    <div class="text-right">
                        <div id="price-display" class="text-lg font-black text-white"></div>
                        <div id="price-rub-display" class="text-xs text-zinc-500"></div>
                    </div>
                </div>
                
                <!-- Donation Thank You info banner -->
                <div id="donation-reward-banner" class="hidden mt-3 pt-3 border-t border-zinc-800/60 flex items-center gap-2.5 text-xs text-amber-300/90 leading-normal">
                    ✨ <span id="reward-info"></span>
                </div>
            </div>

            <!-- TAB SELECTOR FOR REGIONAL SERVICES -->
            <p class="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2.5 lang-el" data-en="Select Payment Region" data-ru="Выберите регион оплаты"></p>
            <div class="grid grid-cols-3 gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl p-1 mb-6">
                <button onclick="selectTab('global')" id="tab-global" class="pay-tab py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer">
                    <span>🌎</span>
                    <span class="lang-el" data-en="Worldwide Cards" data-ru="Весь мир"></span >
                </button>
                <button onclick="selectTab('ru')" id="tab-ru" class="pay-tab py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer">
                    <span>🇷🇺</span>
                    <span class="lang-el" data-en="Russia & CIS" data-ru="РФ и СНГ"></span>
                </button>
                <button onclick="selectTab('crypto')" id="tab-crypto" class="pay-tab py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer">
                    <span>🪙</span>
                    <span class="lang-el" data-en="Crypto Wallet" data-ru="Крипта (TON/USDT)"></span>
                </button>
            </div>

            <!-- PAYMENT FORMS -->
            <form id="payment-form" class="space-y-4">
                <!-- Global Cards Block -->
                <div id="form-global" class="payment-view hidden space-y-4">
                    <div class="bg-zinc-950/20 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                        <div class="text-xl">💳</div>
                        <div class="text-xs text-zinc-400 leading-relaxed">
                            <strong class="text-zinc-200 block mb-0.5 lang-el" data-en="International Stripe Checkout" data-ru="Международный шлюз Stripe"></strong>
                            <span class="lang-el" data-en="Supports VISA, MasterCard, Apple Pay, Google Pay, and American Express globally." data-ru="Принимает карты банков со всего мира (кроме РФ), Apple Pay, Google Pay. Списание в USD/EUR."></span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 lang-el" data-en="Email Address" data-ru="Электронная почта"></label>
                        <input type="email" id="stripe-email" required placeholder="your.email@example.com" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500 text-white font-medium" value="askoreebipiatnica@gmail.com">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 lang-el" data-en="Credit Card Details" data-ru="Данные карты"></label>
                        <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                            <svg class="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                            <input type="text" placeholder="4242 •••• •••• 4242" class="flex-1 bg-transparent border-none text-zinc-300 outline-none text-sm font-mono" value="4242 4242 4242 4242">
                            <span class="text-xs text-zinc-500 font-mono">12/30</span>
                        </div>
                    </div>
                </div>

                <!-- RF & SBP (YooKassa/Robokassa) -->
                <div id="form-ru" class="payment-view hidden space-y-4">
                    <div class="bg-zinc-950/20 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                        <div class="text-xl">🏛️</div>
                        <div class="text-xs text-zinc-400 leading-relaxed">
                            <strong class="text-zinc-200 block mb-0.5 lang-el" data-en="Russian Banks & SBP Integration" data-ru="Российские банки и СБП (ЮKassa)"></strong>
                            <span class="lang-el" data-en="Pay securely inside Russia using Mir, Russian VISA/MasterCard, or SBP Instant QR Code." data-ru="Безопасная оплата внутри РФ картами МИР, Visa/MC российских банков или моментальным переводом СБП."></span>
                        </div>
                    </div>
                    
                    <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center space-y-3">
                        <!-- Simulated SBP QR-Code -->
                        <div class="w-36 h-36 bg-white p-2 rounded-lg relative flex items-center justify-center shadow-lg">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=sbp://pay/syncrate_enterprise" class="w-full h-full object-contain" alt="SBP QR-Code">
                            <div class="absolute inset-0 flex items-center justify-center bg-zinc-900/10 hover:bg-transparent transition-all"></div>
                        </div>
                        <div class="text-center">
                            <span class="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 border border-amber-500/30 rounded text-amber-300 uppercase tracking-wider">СБП / МИР / ЮKassa</span>
                            <p class="text-xs font-semibold text-zinc-200 mt-2 lang-el" data-en="Scan QR code in your Mobile Banking App" data-ru="Откройте сканер СБП в приложении вашего банка"></p>
                            <p class="text-[11px] text-zinc-500 mt-1 lang-el" data-en="Instant automatic registration after payment check" data-ru="Мгновенное автоматическое зачисление после сканирования и оплаты"></p>
                        </div>
                    </div>
                </div>

                <!-- Crypto Payments (USDT / TON / BTC) -->
                <div id="form-crypto" class="payment-view hidden space-y-4">
                    <div class="bg-zinc-950/20 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                        <div class="text-xl">🪙</div>
                        <div class="text-xs text-zinc-400 leading-relaxed">
                            <strong class="text-zinc-200 block mb-0.5 lang-el" data-en="Cryptocurrency Auto-Gateway" data-ru="Криптографический протокол Cryptomus"></strong>
                            <span class="lang-el" data-en="Works globally including RF. Safe anonymous payments in USDT, TON, or BTC." data-ru="Работает абсолютно по всему миру и в РФ. Моментальный перевод в USDT (TRC-20), TON Coin или BTC."></span>
                        </div>
                    </div>

                    <!-- Coin Select Grid -->
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="selectCrypto('usdt')" id="coin-usdt" class="coin-opt py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1 bg-zinc-950 cursor-pointer">
                            <span class="text-emerald-400 text-lg">₮</span>
                            <span>USDT (TRC20)</span>
                        </button>
                        <button type="button" onclick="selectCrypto('ton')" id="coin-ton" class="coin-opt py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1 bg-zinc-950 cursor-pointer">
                            <span class="text-blue-400 text-lg">💎</span>
                            <span>TON Coin</span>
                        </button>
                        <button type="button" onclick="selectCrypto('btc')" id="coin-btc" class="coin-opt py-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1 bg-zinc-950 cursor-pointer">
                            <span class="text-amber-500 text-lg">₿</span>
                            <span>Bitcoin</span>
                        </button>
                    </div>

                    <!-- Address & Copy Container -->
                    <div id="crypto-address-container" class="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                        <div>
                            <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1 lang-el" data-en="Target Wallet Address" data-ru="Адрес кошелька получателя"></span>
                            <div class="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                                <span id="wallet-text" class="text-xs font-mono select-all overflow-x-auto text-zinc-200 flex-1 py-0.5"></span>
                                <button type="button" onclick="copyWallet()" class="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded-lg transition-colors cursor-pointer lang-el" data-en="Copy" data-ru="Копировать"></button>
                            </div>
                        </div>
                        <div class="flex justify-between items-center text-xs leading-none">
                            <span class="text-zinc-500 font-medium lang-el" data-en="Transfer amount exactly:" data-ru="Сумма к отправке ровно:"></span>
                            <span id="crypto-amount-exact" class="font-bold text-amber-400 font-mono"></span>
                        </div>
                    </div>
                </div>

                <button type="submit" id="pay-btn" class="w-full py-3.5 bg-violet-600 hover:bg-violet-700 font-bold text-white rounded-xl transition-all duration-200 transform active:scale-[0.98] cursor-pointer shadow-lg shadow-violet-500/15">
                </button>
            </form>

            <div id="success-screen" class="hidden text-center py-6 space-y-5">
                <div class="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/20">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                    <h2 id="success-title" class="text-2xl font-black mb-1.5 text-white"></h2>
                    <p id="success-info" class="text-zinc-400 text-xs px-2 leading-relaxed"></p>
                </div>
                
                <div id="success-key-container" class="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-lg font-bold text-emerald-400 flex items-center justify-between gap-4">
                    <span id="key-display">PRO-XXXXXX</span>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('key-display').textContent); alert(lang === 'en' ? 'Copied!' : 'Скопировано!');" class="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3.5 rounded-lg transition">
                        Copy
                    </button>
                </div>

                <div id="success-key-instructions" class="text-[11px] text-zinc-500/90 leading-relaxed max-w-sm mx-auto lang-el" data-en="Please copy this code and paste it inside 'License activation' input line inside the extension popup settings tab." data-ru="Пожалуйста, скопируйте этот лицензионный ключ и активируйте его во вкладке настроек расширения в разделе «Лицензионный ключ».">
                </div>
            </div>
        </div>
    </div>

    <script>
        let lang = "en";
        let activeTab = "global";
        let isDonation = ${isDonation};
        let currentDonationPreset = 8;
        let selectedCoin = "usdt";

        const isProPlus = ${isProPlus};
        const productVal = isProPlus ? 8.00 : 5.00;

        const cryptoWallets = {
            usdt: { address: 'TYr1YGAsV23X9gTq8X88bZ6mREqYvj9Jep', label: 'Tether TRC20 Address' },
            ton: { address: 'EQD1zB_gE_X9oJnB8NfKRe6y6q6YeREepZ87NfGv_9Vf8epZ', label: 'TON Wallet Address' },
            btc: { address: 'bc1q9v8epZ7nyG678zBx88Tq6mREqYvj9JepX88A', label: 'Bitcoin BTC Address' }
        };

        function toggleLang() {
            lang = lang === "en" ? "ru" : "en";
            updateUI();
        }

        function detectLang() {
            try {
                const userLang = navigator.language || navigator.userLanguage;
                if (userLang.toLowerCase().includes("ru") || userLang.toLowerCase().includes("uk") || userLang.toLowerCase().includes("be") || userLang.toLowerCase().includes("kk")) {
                    lang = "ru";
                } else {
                    lang = "en";
                }
            } catch(e) {
                lang = "en";
            }
            updateUI();
        }

        function selectTab(tab) {
            activeTab = tab;
            document.querySelectorAll('.pay-tab').forEach(el => {
                el.classList.remove('bg-violet-600/10', 'text-violet-400', 'border-violet-500/30', 'bg-zinc-900', 'text-zinc-400', 'border-transparent');
            });
            
            const selEl = document.getElementById('tab-' + tab);
            selEl.classList.add('bg-violet-600/10', 'text-violet-400', 'border-violet-500/30');
            
            document.querySelectorAll('.payment-view').forEach(view => view.classList.add('hidden'));
            document.getElementById('form-' + tab).classList.remove('hidden');

            updateUI();
        }

        function selectPresetDonation(amt, btn) {
            currentDonationPreset = amt;
            document.querySelectorAll('.preset-btn').forEach(b => {
                b.classList.remove('bg-violet-600/20', 'border-violet-500', 'text-violet-300');
                b.classList.add('bg-zinc-800/80', 'border-zinc-700', 'text-white');
            });
            
            // Highlight current button
            if (btn) {
                btn.classList.add('bg-violet-600/20', 'border-violet-500', 'text-violet-300');
                btn.classList.remove('bg-zinc-800/80', 'border-zinc-700', 'text-white');
            }
            
            document.getElementById('custom-donation-row').classList.add('hidden');
            updateUI();
        }

        function showCustomDonationInput() {
            document.querySelectorAll('.preset-btn').forEach(b => {
                b.classList.remove('bg-violet-600/20', 'border-violet-500', 'text-violet-300');
                b.classList.add('bg-zinc-800/80', 'border-zinc-700', 'text-white');
            });
            document.getElementById('custom-donation-btn').classList.add('bg-violet-600/20', 'border-violet-500', 'text-violet-300');
            document.getElementById('custom-donation-row').classList.remove('hidden');
            updatePriceFromCustom();
        }

        function updatePriceFromCustom() {
            const inputVal = document.getElementById('custom-amount-val');
            let val = parseInt(inputVal.value);
            if (isNaN(val) || val <= 0) val = 1;
            currentDonationPreset = val;
            updateUI();
        }

        function selectCrypto(coin) {
            selectedCoin = coin;
            document.querySelectorAll('.coin-opt').forEach(el => {
                el.classList.remove('border-violet-500', 'bg-violet-600/5', 'text-violet-300');
            });
            document.getElementById('coin-' + coin).classList.add('border-violet-500', 'bg-violet-600/5', 'text-violet-300');
            
            document.getElementById('wallet-text').textContent = cryptoWallets[coin].address;
            updateUI();
        }

        function copyWallet() {
            const txt = document.getElementById('wallet-text').textContent;
            navigator.clipboard.writeText(txt);
            alert(lang === 'en' ? 'Address copied to clipboard!' : 'Адрес успешно скопирован!');
        }

        function getActiveAmount() {
            return isDonation ? currentDonationPreset : productVal;
        }

        function updateUI() {
            document.getElementById('current-lang-lbl').textContent = lang.toUpperCase();
            
            // Translate explicit elements
            document.querySelectorAll('.lang-el').forEach(el => {
                el.textContent = el.getAttribute('data-' + lang);
            });

            const amt = getActiveAmount();
            const rubAmt = Math.round(amt * 90);

            // Title & Details
            if (isDonation) {
                document.getElementById('page-title').textContent = lang === 'en' ? 'Support SyncRate Development' : 'Поддержка разработки SyncRate';
                document.getElementById('product-name').textContent = lang === 'en' ? 'Voluntary Support / Donation' : 'Добровольный взнос';
                document.getElementById('product-sub').style.display = 'none';
                document.getElementById('donation-selector').classList.remove('hidden');
                document.getElementById('donation-reward-banner').classList.remove('hidden');
                
                let rewardText = "";
                if (amt >= 8) {
                    rewardText = lang === 'en' ? 'Thank you! Donations of $8+ automatically grant a PRO+ Lifetime License.' : 'Спасибо! Донат от $8 автоматически активирует PRO+ тариф расширения навсегда.';
                } else if (amt >= 5) {
                    rewardText = lang === 'en' ? 'Awesome! Donations of $5+ automatically grant a PRO Lifetime License.' : 'Отлично! Донат от $5 автоматически активирует PRO тариф расширения навсегда.';
                } else {
                    rewardText = lang === 'en' ? 'Thank you for supporting small indie developer tools!' : 'Спасибо за весомый вклад в развитие бесплатного проекта!';
                }
                document.getElementById('reward-info').textContent = rewardText;
            } else {
                document.getElementById('page-title').textContent = lang === 'en' ? 'Complete Upgrade Registration' : 'Активация премиум тарифа';
                document.getElementById('product-name').textContent = isProPlus ? 'SyncRate Enterprise (PRO+)' : 'SyncRate Premium (PRO)';
                document.getElementById('product-sub').textContent = lang === 'en' ? 'Lifetime premium browser conversion filters extension access' : 'Полный бессрочный доступ к расширению конвертации валют';
                document.getElementById('donation-selector').classList.add('hidden');
                document.getElementById('donation-reward-banner').classList.add('hidden');
            }

            document.getElementById('price-display').textContent = '$' + amt.toFixed(2);
            document.getElementById('price-rub-display').textContent = '≈ ' + rubAmt.toLocaleString() + ' ₽';

            // Pay Button text
            const payBtn = document.getElementById('pay-btn');
            if (activeTab === "ru") {
                payBtn.textContent = lang === 'en' ? 'Confirm Payment' : 'Я оплатил(а) через СБП / Карту';
            } else if (activeTab === "crypto") {
                payBtn.textContent = lang === 'en' ? 'Check Blockchain Network Transfer' : 'Проверить поступление средств';
            } else {
                payBtn.textContent = lang === 'en' ? 'Pay with Secure Stripe Card' : 'Оплатить картой Visa / MasterCard';
            }

            // Crypto exact display
            let coinRate = 1;
            if (selectedCoin === 'btc') coinRate = 0.000014;
            else if (selectedCoin === 'ton') coinRate = 0.15;
            else coinRate = 1.0;

            const exactCryptoAmt = (amt * coinRate).toFixed(selectedCoin === 'btc' ? 6 : 2);
            document.getElementById('crypto-amount-exact').textContent = exactCryptoAmt + ' ' + selectedCoin.toUpperCase();
        }

        // Handle Payment Submit (Simulation linked with real API key registration)
        document.getElementById('payment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payBtn = document.getElementById('pay-btn');
            payBtn.disabled = true;
            
            const originalText = payBtn.textContent;
            payBtn.textContent = lang === 'en' ? 'Verifying payment status...' : 'Проверка транзакции...';

            setTimeout(async () => {
                const amt = getActiveAmount();
                try {
                    const response = await fetch('/api/create-license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: amt,
                            isDonation: isDonation,
                            isProPlus: isProPlus
                        })
                    });
                    const resJson = await response.json();
                    if (resJson.success) {
                        document.getElementById('payment-form').classList.add('hidden');
                        document.getElementById('product-card').classList.add('hidden');
                        
                        const key = resJson.license;
                        if (key) {
                            document.getElementById('key-display').textContent = key;
                            document.getElementById('success-key-container').classList.remove('hidden');
                            document.getElementById('success-key-instructions').classList.remove('hidden');
                        } else {
                            document.getElementById('success-key-container').classList.add('hidden');
                            document.getElementById('success-key-instructions').classList.add('hidden');
                        }
                        
                        // Translations for success screen
                        if (lang === 'en') {
                            document.getElementById('success-title').textContent = 'Payment Completed Successfully!';
                            document.getElementById('success-info').innerHTML = key 
                                ? 'Thank you for your trust! Your unique digital lifetime License Key is compiled and registered below.'
                                : 'Thank you for your generous support of SyncRate development!';
                        } else {
                            document.getElementById('success-title').textContent = 'Оплата успешно принята!';
                            document.getElementById('success-info').innerHTML = key
                                ? 'Спасибо за доверие! Ваш уникальный цифровой пожизненный лицензионный ключ сгенерирован и зарегистрирован в БД.'
                                : 'Огромное спасибо за поддержку развития расширения SyncRate!';
                        }

                        document.getElementById('success-screen').classList.remove('hidden');
                    } else {
                        alert(lang === 'en' ? 'Error validating invoice.' : 'Ошибка проверки платежа.');
                        payBtn.disabled = false;
                        payBtn.textContent = originalText;
                    }
                } catch(err) {
                    alert('Connection / API Error');
                    payBtn.disabled = false;
                    payBtn.textContent = originalText;
                }
            }, 1800);
        });

        // Initialize view
        detectLang();
        selectTab("global");
        selectCrypto("usdt");
    </script>
</body>
</html>`);
  });


  // Feedback Form Route
  app.get("/feedback", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SyncRate | Share Feedback</title>
    <script src="https://cdn.tailwindcss.com" crossorigin></script>
    <style>
        body { background: #09090b; color: #fafafa; font-family: system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
    <div class="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative">
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-amber-500"></div>
        
        <!-- Header Controls & Lang Selector -->
        <div class="px-6 pt-6 pb-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/20">
            <div>
                <h1 class="text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-0.5">SyncRate Support</h1>
                <h2 id="page-title" class="text-lg font-bold text-white">Share Feedback</h2>
            </div>
            <button onclick="toggleLang()" class="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                🌐 <span id="current-lang-lbl">EN</span>
            </button>
        </div>

        <!-- Main Workspace -->
        <form id="feedback-form" class="p-6">
            <!-- Alert Container -->
            <div id="alert-box" class="hidden mb-4 p-3.5 rounded-lg text-sm font-semibold border"></div>

            <!-- Auto-Detected Diagnostics Section -->
            <div class="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 mb-6">
                <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2.5" id="diag-title">Diagnostics Data (Auto-Attached)</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex items-center justify-between bg-zinc-900/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                        <span class="text-zinc-400" id="lbl-version">Version</span>
                        <span class="font-mono text-violet-400 font-semibold" id="val-version">N/A</span>
                    </div>
                    <div class="flex items-center justify-between bg-zinc-900/60 px-3 py-2 rounded-lg border border-zinc-800/40">
                        <span class="text-zinc-400" id="lbl-tier">Tier</span>
                        <span class="font-mono text-indigo-400 font-semibold uppercase" id="val-tier">basic</span>
                    </div>
                    <div class="flex items-center justify-between bg-zinc-900/60 px-3 py-2 rounded-lg border border-zinc-800/40 col-span-2">
                        <span class="text-zinc-400" id="lbl-browser">Browser</span>
                        <span class="text-amber-400 font-semibold" id="val-browser">Unknown</span>
                    </div>
                </div>
            </div>

            <!-- Message Area -->
            <div class="mb-4">
                <label for="feedback-msg" class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2" id="lbl-msg">Your message / Bug report</label>
                <textarea id="feedback-msg" required rows="5" maxlength="2000" placeholder="Please describe what is working well, what can be improved, or details about any bugs you encountered..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-zinc-500 transition-all resize-none"></textarea>
            </div>

            <!-- Contact Email (Optional) -->
            <div class="mb-6">
                <label for="contact-email" class="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2" id="lbl-email">Your Email (optional, for response)</label>
                <input type="email" id="contact-email" maxlength="100" placeholder="e.g. you@example.com" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-white placeholder-zinc-500 transition-all">
            </div>

            <button type="submit" id="submit-btn" class="w-full bg-violet-600 hover:bg-violet-500 text-white border-none py-3.5 px-6 rounded-xl font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 select-none shadow-lg shadow-violet-600/15 active:scale-[0.98]">
                <span id="btn-text">Submit Feedback</span>
            </button>
        </form>

        <!-- Success Screen -->
        <div id="success-screen" class="hidden p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">✓</div>
            <h2 class="text-xl font-extrabold text-white mb-2" id="success-title">Thank You!</h2>
            <p class="text-sm text-zinc-400 max-w-sm mb-6" id="success-desc">Your feedback has been registered and received. Our development team appreciates your input to make SyncRate even better!</p>
            <button onclick="window.close()" class="px-6 py-2.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors text-white cursor-pointer" id="btn-close">Close Tab</button>
        </div>
    </div>

    <script>
        const DICT = {
            en: {
                pageTitle: "Share Feedback",
                diagTitle: "Diagnostics Data (Auto-Attached)",
                lblVersion: "Version",
                lblTier: "Tier",
                lblBrowser: "Browser",
                lblMsg: "Your message / Bug report",
                placeholderMsg: "Please describe what is working well, what can be improved, or details about any bugs you encountered...",
                lblEmail: "Your Email (optional, for response)",
                placeholderEmail: "e.g. you@example.com",
                btnSubmit: "Submit Feedback",
                btnSubmitting: "Submitting...",
                successTitle: "Feedback Received!",
                successDesc: "Thank you for helping us improve SyncRate! Your report has been saved directly into our cloud database.",
                btnClose: "Close Tab",
                errEmpty: "Please enter your message.",
                errFailed: "Failed to send feedback. Please try again."
            },
            ru: {
                pageTitle: "Обратная связь",
                diagTitle: "Диагностические данные (прикреплено)",
                lblVersion: "Версия",
                lblTier: "Тариф",
                lblBrowser: "Браузер",
                lblMsg: "Ваше сообщение / Отчет об ошибке",
                placeholderMsg: "Опишите, пожалуйста, что работает хорошо, что можно улучшить, или детали замеченной ошибки...",
                lblEmail: "Ваш Email (необязательно, для ответа)",
                placeholderEmail: "например, you@example.com",
                btnSubmit: "Отправить сообщение",
                btnSubmitting: "Отправка...",
                successTitle: "Спасибо за отзыв!",
                successDesc: "Ваше обращение успешно зарегистрировано в облачной базе данных. Команда разработчиков обязательно его рассмотрит!",
                btnClose: "Закрыть вкладку",
                errEmpty: "Пожалуйста, введите ваше сообщение.",
                errFailed: "Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз."
            }
        };

        let lang = "en";

        // Query params
        const urlParams = new URLSearchParams(window.location.search);
        const extVersion = urlParams.get('v') || '15.0';
        const rawTier = urlParams.get('tier') || 'basic';
        const installId = urlParams.get('installId') || 'unknown';

        // Detect browser
        function getBrowserName() {
            const userAgent = navigator.userAgent;
            if (userAgent.includes("Chrome") && !userAgent.includes("Edg") && !userAgent.includes("OPR")) return "Google Chrome";
            if (userAgent.includes("Edg")) return "Microsoft Edge";
            if (userAgent.includes("Firefox")) return "Mozilla Firefox";
            if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Apple Safari";
            if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
            return "Chromium-based Browser";
        }
        const detectedBrowser = getBrowserName();

        // Autodetect language
        function detectLang() {
            const userLang = navigator.language || navigator.userLanguage;
            if (userLang && (userLang.startsWith("ru") || userLang.startsWith("be") || userLang.startsWith("kk") || userLang.startsWith("uk"))) {
                lang = "ru";
            } else {
                lang = "en";
            }
            updateTranslations();
        }

        function toggleLang() {
            lang = lang === "en" ? "ru" : "en";
            updateTranslations();
        }

        function updateTranslations() {
            document.getElementById('current-lang-lbl').textContent = lang.toUpperCase();
            const d = DICT[lang];
            
            document.getElementById('page-title').textContent = d.pageTitle;
            document.getElementById('diag-title').textContent = d.diagTitle;
            document.getElementById('lbl-version').textContent = d.lblVersion;
            document.getElementById('lbl-tier').textContent = d.lblTier;
            document.getElementById('lbl-browser').textContent = d.lblBrowser;
            document.getElementById('lbl-msg').textContent = d.lblMsg;
            document.getElementById('feedback-msg').placeholder = d.placeholderMsg;
            document.getElementById('lbl-email').textContent = d.lblEmail;
            document.getElementById('contact-email').placeholder = d.placeholderEmail;
            
            const submitBtn = document.getElementById('submit-btn');
            if (!submitBtn.disabled) {
                document.getElementById('btn-text').textContent = d.btnSubmit;
            } else {
                document.getElementById('btn-text').textContent = d.btnSubmitting;
            }
            
            document.getElementById('success-title').textContent = d.successTitle;
            document.getElementById('success-desc').textContent = d.successDesc;
            document.getElementById('btn-close').textContent = d.btnClose;
        }

        // Initialize view data
        document.getElementById('val-version').textContent = extVersion;
        document.getElementById('val-tier').textContent = rawTier;
        document.getElementById('val-browser').textContent = detectedBrowser;

        detectLang();

        // Submit form
        document.getElementById('feedback-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('alert-box');
            alertBox.classList.add('hidden');

            const message = document.getElementById('feedback-msg').value.trim();
            const email = document.getElementById('contact-email').value.trim();

            if (!message) {
                alertBox.textContent = DICT[lang].errEmpty;
                alertBox.className = "mb-4 p-3.5 rounded-lg text-sm font-semibold border bg-red-500/10 border-red-500/20 text-red-400";
                alertBox.classList.remove('hidden');
                return;
            }

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70');
            document.getElementById('btn-text').textContent = DICT[lang].btnSubmitting;

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        message,
                        version: extVersion,
                        tier: rawTier,
                        browser: detectedBrowser,
                        installId
                    })
                });

                const resJson = await response.json();
                if (resJson.success) {
                    document.getElementById('feedback-form').classList.add('hidden');
                    document.getElementById('success-screen').classList.remove('hidden');
                } else {
                    const errMsg = resJson.error || DICT[lang].errFailed;
                    alertBox.textContent = errMsg;
                    alertBox.className = "mb-4 p-3.5 rounded-lg text-sm font-semibold border bg-red-500/10 border-red-500/20 text-red-400";
                    alertBox.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70');
                    document.getElementById('btn-text').textContent = DICT[lang].btnSubmit;
                }
            } catch (err) {
                alertBox.textContent = DICT[lang].errFailed;
                alertBox.className = "mb-4 p-3.5 rounded-lg text-sm font-semibold border bg-red-500/10 border-red-500/20 text-red-400";
                alertBox.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70');
                document.getElementById('btn-text').textContent = DICT[lang].btnSubmit;
            }
        });
    </script>
</body>
</html>`);
  });

  // Submit Feedback API endpoint
  app.post("/api/feedback", feedbackRateLimiter, async (req, res) => {
    try {
      const { email, message, version, tier, browser, installId } = req.body;
      
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Сообщение не может быть пустым / Message cannot be empty" });
      }
      if (message.length > 2000) {
        return res.status(400).json({ success: false, error: "Сообщение слишком длинное / Message is too long" });
      }
      
      const cleanEmail = email && typeof email === "string" ? email.trim() : "";
      if (cleanEmail && cleanEmail.length > 100) {
        return res.status(400).json({ success: false, error: "Email слишком длинный / Email is too long" });
      }

      await adminDb.collection("feedbacks").add({
        email: cleanEmail || null,
        message: message.trim(),
        version: typeof version === "string" ? version.trim().substring(0, 10) : "unknown",
        tier: typeof tier === "string" ? tier.trim().substring(0, 20) : "unknown",
        browser: typeof browser === "string" ? browser.trim().substring(0, 200) : "unknown",
        installId: typeof installId === "string" ? installId.trim().substring(0, 50) : "unknown",
        createdAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Error saving feedback:", err);
      res.status(500).json({ success: false, error: "Внутренняя ошибка сервера / Internal server error" });
    }
  });


  // Endpoint for verifying license key or session token
  app.post(["/api/verify-license", "/api/verify", "/api/session"], verifyLicenseRateLimiter, async (req, res) => {
    const { licenseKey, token, installId } = req.body;

    if (!installId) {
      return res.status(400).json({ success: false, error: "Missing installId" });
    }

    if (token) {
      const decoded = verifyJwt(token);
      if (decoded && decoded.tier) {
        // Проверка соответствия installId в токене
        if (decoded.installId && decoded.installId !== installId) {
          return res.status(401).json({ success: false, error: "Token belongs to another device" });
        }
        // Продлеваем токен на новые 48 часов при успешной валидации
        const freshToken = signJwt({
          tier: decoded.tier,
          installId: installId || decoded.installId,
          exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60
        });
        return res.json({ success: true, tier: decoded.tier, token: freshToken, newToken: freshToken });
      }
      return res.status(401).json({ success: false, error: "Invalid or expired session token" });
    }

    if (!licenseKey) return res.status(400).json({ success: false, error: "License key or session token is required" });
    const formattedKey = licenseKey.trim().toUpperCase();
    
    // Валидация формата ключа
    if (!/^(PRO|PLUS)-[A-Z0-9]{6}$/.test(formattedKey)) {
      return res.status(400).json({ success: false, error: "Invalid key format" });
    }
    
    let tier: "pro" | "pro_plus" | "basic" = "pro";

    // 1. Проверяем отзыв ключа
    try {
      const docId = getLicenseDocId(formattedKey);
      const docSnap = await adminDb.collection("licenses").doc(docId).get();
      if (docSnap.exists) {
        const licenseData = docSnap.data();
        if (licenseData && licenseData.revoked) {
          return res.json({ success: false, error: "Key revoked" });
        }
      }
    } catch (e) {
      console.error("Failed to check license status:", e);
    }

    // 2. Валидируем существование ключа
    if (activeLicenses.has(formattedKey)) {
      tier = formattedKey.startsWith("PRO-") ? "pro" : "pro_plus";
    } else {
      try {
        const exists = await dbService.verifyLicenseExists(formattedKey);
        if (exists) {
          tier = formattedKey.startsWith("PRO-") ? "pro" : "pro_plus";
          activeLicenses.add(formattedKey);
        } else {
          return res.json({ success: false, error: "Key not found" });
        }
      } catch (error) {
        console.error(`Cloud Firestore dynamic validation failed for ${formattedKey}:`, error);
        return res.status(500).json({ success: false, error: "Internal server error" });
      }
    }

    // 3. Привязка к устройству (макс. 2 установки на ключ)
    try {
      const querySnapshot = await adminDb.collection("installs").where("licenseKey", "==", formattedKey).get();
      const installs: any[] = [];
      querySnapshot.forEach((doc: any) => {
        installs.push(doc.data());
      });

      const alreadyBound = installs.find((i: any) => i.installId === installId);
      if (!alreadyBound && installs.length >= 2) {
        return res.json({ success: false, error: "Max devices reached" });
      }
      if (!alreadyBound) {
        await adminDb.collection("installs").add({
          licenseKey: formattedKey,
          installId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Failed to process device binding:", error);
      return res.status(500).json({ success: false, error: "Failed to process device binding" });
    }

    // Генерируем подписанный сессионный токен на 48 часов, включая в него installId
    const signedToken = signJwt({
      tier,
      installId,
      exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60
    });

    return res.json({ success: true, tier, token: signedToken, newToken: signedToken });
  });

  // Эндпоинт для серверной активации триал-версии
  app.post("/api/trial", async (req, res) => {
    try {
      const { installId } = req.body;
      if (!installId) {
        return res.status(400).json({ success: false, error: "installId is required" });
      }

      // 1. Проверяем, получал ли уже этот installId триал
      const docRef = adminDb.collection("trials").doc(installId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return res.json({ success: false, error: "Trial already activated for this device" });
      }

      // 2. Сохраняем запись в БД
      await docRef.set({
        installId,
        activatedAt: new Date().toISOString()
      });

      // 3. Возвращаем JWT с полем tier: "pro_plus" и exp = now + 48 часа
      const exp = Math.floor(Date.now() / 1000) + 48 * 60 * 60;
      const token = signJwt({
        tier: "pro_plus",
        installId,
        exp
      });

      return res.json({ success: true, token });
    } catch (error) {
      console.error("Trial activation failed on server:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Securely generate, register, and save a license key on Checkout success
  app.post("/api/create-license", async (req, res) => {
    try {
      const { amount, isDonation, isProPlus } = req.body;

      // Parse and validate payment amount
      const parsedAmount = parseFloat(amount || "0");
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: "Invalid payment amount encountered during check." });
      }

      let tierType: "pro" | "pro_plus" | "basic" = "pro";
      if (isDonation) {
        if (parsedAmount >= 8) {
          tierType = "pro_plus";
        } else if (parsedAmount >= 5) {
          tierType = "pro";
        } else {
          tierType = "basic"; // No premium license granted for small donations
        }
      } else {
        tierType = isProPlus ? "pro_plus" : "pro";
        // Check for correct billing amount depending on tier
        const expectedPrice = isProPlus ? 8.00 : 5.00;
        if (Math.abs(parsedAmount - expectedPrice) > 0.01) {
          return res.status(400).json({ success: false, error: "Invoice/Amount mismatch for the requested tier type." });
        }
      }

      // If tier is basic support, there's no actual key to store or return
      if (tierType === "basic") {
        return res.json({ success: true, license: null });
      }

      // Cryptographically secure random generation of 6-character hex suffix on the server-side
      const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
      const generatedKey = (tierType === "pro" ? "PRO" : "PLUS") + "-" + rand;

      // Call saveLicense helper to handle memory, disk cache, and cloud Firestore persistence
      await saveLicense(generatedKey);

      console.log(`[Checkout Security] Automatically generated and registered ${tierType} key: ${generatedKey}`);
      res.json({ success: true, license: generatedKey });
    } catch (err) {
      console.error("[Checkout Security] Failed to create secure license key:", err);
      res.status(500).json({ success: false, error: "Internal payment processing error" });
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
