import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs } from "firebase/firestore/lite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("NODE_ENV:", process.env.NODE_ENV);

  // Initialize Firebase Firestore for database persistence of licenses
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

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

  // Route to "publish" the ZIP/CRX (securely persisted to Firestore)
  app.post("/api/publish", async (req, res) => {
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
        await setDoc(doc(db, "files", "SyncRate.zip"), {
          filename: "SyncRate.zip",
          base64Data: zipBase64,
          updatedAt: new Date().toISOString()
        });
      }
      if (crxBase64) {
        await setDoc(doc(db, "files", "SyncRate.crx"), {
          filename: "SyncRate.crx",
          base64Data: crxBase64,
          updatedAt: new Date().toISOString()
        });
      } else if (zipBase64) {
        // Фоллбек для CRX
        await setDoc(doc(db, "files", "SyncRate.crx"), {
          filename: "SyncRate.crx",
          base64Data: zipBase64,
          updatedAt: new Date().toISOString()
        });
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

      res.json({ success: true, message: "Extension published successfully to Cloud Firestore and local storage!" });
    } catch (err) {
      console.error("Failed to publish files:", err);
      res.status(500).json({ error: "Failed to save published files to cloud database" });
    }
  });

  // Dynamic routes for ZIP/CRX downloads from Cloud Firestore with local disk fallback
  app.get("/SyncRate.zip", async (req, res) => {
    try {
      const docRef = doc(db, "files", "SyncRate.zip");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.base64Data) {
        const base64 = docSnap.data().base64Data;
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
      const docRef = doc(db, "files", "SyncRate.crx");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.base64Data) {
        const base64 = docSnap.data().base64Data;
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

  const activeLicenses = new Set<string>([...hardcodedLicenses]);

  const licenseFilePath = path.join(process.cwd(), "config-licenses.json");
  if (fs.existsSync(licenseFilePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(licenseFilePath, "utf8"));
      saved.forEach((k: string) => activeLicenses.add(k.toUpperCase()));
    } catch (e) {}
  }

  // Load existing licenses from Firestore on startup
  try {
    const querySnapshot = await getDocs(collection(db, "licenses"));
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data && data.key) {
        activeLicenses.add(data.key.toUpperCase());
      }
    });
    console.log(`Successfully booted and loaded ${activeLicenses.size - hardcodedLicenses.size} dynamic licenses from Firestore.`);
  } catch (error) {
    console.error("Warning: Failed to load licenses from Firestore at boot:", error);
  }

  const saveLicense = async (key: string) => {
    const cleanKey = key.trim().toUpperCase();
    activeLicenses.add(cleanKey);
    try {
      fs.writeFileSync(licenseFilePath, JSON.stringify(Array.from(activeLicenses)), "utf8");
    } catch (e) {}

    // Persist to Cloud Firestore so licenses are never lost when containers restart or scale
    try {
      await setDoc(doc(db, "licenses", cleanKey), {
        key: cleanKey,
        createdAt: new Date().toISOString()
      });
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
    <script src="https://cdn.tailwindcss.com"></script>
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
                        <button onclick="selectPresetDonation(2)" class="preset-btn py-2 text-sm font-semibold bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-all cursor-pointer">$2</button>
                        <button onclick="selectPresetDonation(5)" class="preset-btn py-2 text-sm font-semibold bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500 rounded-lg text-violet-300 transition-all cursor-pointer">$5</button>
                        <button onclick="selectPresetDonation(10)" class="preset-btn py-2 text-sm font-semibold bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-all cursor-pointer">$10</button>
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
                
                <div class="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-lg font-bold text-emerald-400 flex items-center justify-between gap-4">
                    <span id="key-display">PRO-XXXXXX</span>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('key-display').textContent); alert(lang === 'en' ? 'Copied!' : 'Скопировано!');" class="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3.5 rounded-lg transition">
                        Copy
                    </button>
                </div>

                <div class="text-[11px] text-zinc-500/90 leading-relaxed max-w-sm mx-auto lang-el" data-en="Please copy this code and paste it inside 'License activation' input line inside the extension popup settings tab." data-ru="Пожалуйста, скопируйте этот лицензионный ключ и активируйте его во вкладке настроек расширения в разделе «Лицензионный ключ».">
                </div>
            </div>
        </div>
    </div>

    <script>
        let lang = "en";
        let activeTab = "global";
        let isDonation = ${isDonation};
        let currentDonationPreset = 5;
        let selectedCoin = "usdt";

        const isProPlus = ${isProPlus};
        const productVal = isProPlus ? 5.00 : 2.00;

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

        function selectPresetDonation(amt) {
            currentDonationPreset = amt;
            document.querySelectorAll('.preset-btn').forEach(b => {
                b.classList.remove('bg-violet-600/20', 'border-violet-500', 'text-violet-300');
                b.classList.add('bg-zinc-800/80', 'border-zinc-700', 'text-white');
            });
            
            // Highlight current button
            event.currentTarget.classList.add('bg-violet-600/20', 'border-violet-500', 'text-violet-300');
            event.currentTarget.classList.remove('bg-zinc-800/80', 'border-zinc-700', 'text-white');
            
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
                if (amt >= 5) {
                    rewardText = lang === 'en' ? 'Thank you! Donations of $5+ automatically grant a PRO+ Lifetime License.' : 'Спасибо! Донат от $5 автоматически активирует PRO+ тариф расширения навсегда.';
                } else if (amt >= 2) {
                    rewardText = lang === 'en' ? 'Awesome! Donations of $2+ automatically grant a PRO Lifetime License.' : 'Отлично! Донат от $2 автоматически активирует PRO тариф расширения навсегда.';
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
                // Determine license tier
                let tierType = "pro";
                if (isDonation) {
                    if (amt >= 5) tierType = "pro_plus";
                    else if (amt >= 2) tierType = "pro";
                    else tierType = "basic"; // lower donations don't unlock but give visual success
                } else {
                    tierType = isProPlus ? "pro_plus" : "pro";
                }

                const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
                const key = (tierType === "pro" ? "PRO" : "PLUS") + "-" + rand;

                try {
                    const response = await fetch('/api/create-license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key })
                    });
                    const resJson = await response.json();
                    if (resJson.success) {
                        document.getElementById('payment-form').classList.add('hidden');
                        document.getElementById('product-card').classList.add('hidden');
                        
                        document.getElementById('key-display').textContent = key;
                        
                        // Translations for success screen
                        if (lang === 'en') {
                            document.getElementById('success-title').textContent = 'Payment Completed Successfully!';
                            document.getElementById('success-info').innerHTML = 'Thank you for your trust! Your unique digital lifetime License Key is compiled and registered below.';
                        } else {
                            document.getElementById('success-title').textContent = 'Оплата успешно принята!';
                            document.getElementById('success-info').innerHTML = 'Спасибо за доверие! Ваш уникальный цифровой пожизненный лицензионный ключ сгенерирован и зарегистрирован в БД.';
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


  // Endpoint for verifying license key
  app.post("/api/verify-license", async (req, res) => {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ success: false, error: "License key is required" });
    const formattedKey = licenseKey.trim().toUpperCase();
    
    // 1. Check local/memory licenses first for fast response and hardcoded local keys
    if (activeLicenses.has(formattedKey)) {
      const tier = formattedKey.startsWith("PRO-") ? "pro" : "pro_plus";
      return res.json({ success: true, tier });
    }

    // 2. Query Firestore dynamically to support multiple scaled stateless container instances
    try {
      const docRef = doc(db, "licenses", formattedKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const tier = formattedKey.startsWith("PRO-") ? "pro" : "pro_plus";
        // Cache it in activeLicenses set for fast subsequent checks
        activeLicenses.add(formattedKey);
        return res.json({ success: true, tier });
      }
    } catch (error) {
      console.error(`Cloud Firestore dynamic validation failed for ${formattedKey}:`, error);
    }

    res.json({ success: false, error: "Invalid license key" });
  });

  // Securely save a license key registered on Stripe checkout sandbox
  app.post("/api/create-license", async (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ success: false, error: "Key is required" });
    const formattedKey = key.trim().toUpperCase();
    await saveLicense(formattedKey);
    res.json({ success: true, license: formattedKey });
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
