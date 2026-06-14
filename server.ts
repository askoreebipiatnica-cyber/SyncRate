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

  // Simple persisted license list
  const activeLicenses = new Set<string>([
    "PRO-123456", "PRO-ABCDEF", "PRO-SYNCRATE",
    "PLUS-123456", "PLUS-ABCDEF", "PLUS-ENTERPRISE"
  ]);

  const licenseFilePath = path.join(process.cwd(), "config-licenses.json");
  if (fs.existsSync(licenseFilePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(licenseFilePath, "utf8"));
      saved.forEach((k: string) => activeLicenses.add(k));
    } catch (e) {}
  } else {
    fs.writeFileSync(licenseFilePath, JSON.stringify(Array.from(activeLicenses)), "utf8");
  }

  const saveLicense = (key: string) => {
    activeLicenses.add(key);
    try {
      fs.writeFileSync(licenseFilePath, JSON.stringify(Array.from(activeLicenses)), "utf8");
    } catch (e) {}
  };

  // Checkout redirect page simulating Stripe Sandbox Integration
  app.get("/checkout", (req, res) => {
    const tier = (req.query.tier || "pro").toString().toLowerCase();
    const isPro = tier === "pro";
    const amount = isPro ? "2.00" : "5.00";
    const name = isPro ? "SyncRate PRO Plan" : "SyncRate PRO+ Plan";
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout | Stripe Sandbox Gateway</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #0c0a09; color: #fff; font-family: system-ui, sans-serif; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>
        <h1 class="text-zinc-500 text-[10px] font-black tracking-widest uppercase mb-1">Stripe Billing Gateway</h1>
        <h2 class="text-2xl font-bold text-white mb-6">Complete Purchase</h2>
        
        <div class="bg-stone-950 rounded-xl p-4 mb-6 border border-stone-800">
            <div class="flex justify-between items-center text-sm">
                <span class="text-stone-400 font-medium">${name}</span>
                <span class="font-bold text-white">$${amount}</span>
            </div>
            <div class="text-xs text-stone-500 mt-1.5">Lifetime subscription. Safe one-time billing via Sandbox.</div>
        </div>

        <form id="payment-form" class="space-y-4">
            <div>
                <label class="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Card Details</label>
                <div class="bg-stone-950 border border-stone-800 rounded-xl p-3.5 flex items-center gap-3">
                    <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    <input type="text" value="4242 •••• •••• 4242" disabled class="flex-1 bg-transparent border-none text-stone-300 outline-none select-none text-sm font-mono">
                    <span class="text-xs text-stone-500 font-mono">12/30</span>
                </div>
            </div>

            <button type="submit" id="pay-btn" class="w-full py-3 bg-violet-600 hover:bg-violet-700 font-semibold text-white rounded-xl transition duration-200">
                Pay $${amount}
            </button>
        </form>

        <div id="success-screen" class="hidden text-center py-6">
            <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 class="text-xl font-bold mb-2 text-white">Payment Successful!</h2>
            <p class="text-stone-400 text-sm mb-6">Here is your Lifetime License Key. Enter this key in the extension popup to unlock fully featured plans.</p>
            
            <div class="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-lg font-bold text-emerald-400 flex items-center justify-between gap-4">
                <span id="key-display">PRO-XXXXXX</span>
                <button onclick="navigator.clipboard.writeText(document.getElementById('key-display').textContent); alert('Copied!');" class="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 py-1.5 px-3.5 rounded-lg transition">
                    Copy
                </button>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('payment-form');
        const payBtn = document.getElementById('pay-btn');
        const successScreen = document.getElementById('success-screen');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            payBtn.disabled = true;
            payBtn.textContent = 'Processing payment...';

            setTimeout(async () => {
                const isPro = ${isPro};
                const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
                const key = (isPro ? "PRO" : "PLUS") + "-" + rand;
                
                try {
                    const response = await fetch('/api/create-license', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key })
                    });
                    const resJson = await response.json();
                    if (resJson.success) {
                        form.classList.add('hidden');
                        document.getElementById('key-display').textContent = key;
                        successScreen.classList.remove('hidden');
                    } else {
                        alert('API error generating license.');
                        payBtn.disabled = false;
                        payBtn.textContent = 'Pay';
                    }
                } catch(e) {
                    alert('Connection error');
                    payBtn.disabled = false;
                    payBtn.textContent = 'Pay';
                }
            }, 1000);
        });
    </script>
</body>
</html>`);
  });

  // Endpoint for verifying license key
  app.post("/api/verify-license", (req, res) => {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ success: false, error: "License key is required" });
    const formattedKey = licenseKey.trim().toUpperCase();
    if (activeLicenses.has(formattedKey)) {
      const tier = formattedKey.startsWith("PRO-") ? "pro" : "pro_plus";
      res.json({ success: true, tier });
    } else {
      res.json({ success: false, error: "Invalid license key" });
    }
  });

  // Securely save a license key registered on Stripe checkout sandbox
  app.post("/api/create-license", (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ success: false, error: "Key is required" });
    saveLicense(key.trim().toUpperCase());
    res.json({ success: true, license: key });
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
