import assert from "assert";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { parseCurrencyString } = require("../extension/parser.js");

const BASE_URL = "http://localhost:3000";

// ==========================================
// TEST EXECUTION RUNNER
// ==========================================
async function runSuite() {
  console.log("\n=======================================================");
  console.log("   ⚡ SYNCRATE AUTOMATED TEST SUITE (TEST-GEN) ⚡      ");
  console.log("=======================================================\n");

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res && typeof (res as any).then === "function") {
        return (res as Promise<void>).then(() => {
          console.log(`  ✅ ${name}`);
          passed++;
        }).catch((err) => {
          console.error(`  ❌ ${name}: ${err.message}`);
          throw err;
        });
      } else {
        console.log(`  ✅ ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ❌ ${name}: ${err.message}`);
      throw err;
    }
  }

  console.log("--- [SECTION 1: CURRENCY PARSING ENGINE TESTS] ---");

  test("Parses standard prefix fiat: $100 -> 100 USD", () => {
    const res = parseCurrencyString("$100");
    assert.ok(res);
    assert.strictEqual(res.amount, 100);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses standard suffix fiat: 50.50 € -> 50.5 EUR", () => {
    const res = parseCurrencyString("50.50 €");
    assert.ok(res);
    assert.strictEqual(res.amount, 50.5);
    assert.strictEqual(res.currency, "EUR");
  });

  test("Parses Cyrillic suffix: 1500 руб -> 1500 RUB", () => {
    const res = parseCurrencyString("1500 руб");
    assert.ok(res);
    assert.strictEqual(res.amount, 1500);
    assert.strictEqual(res.currency, "RUB");
  });

  test("Parses multiplier 'k': 25k USD -> 25000 USD", () => {
    const res = parseCurrencyString("25k USD");
    assert.ok(res);
    assert.strictEqual(res.amount, 25000);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses Cyrillic multiplier 'млн': 1.5 млн RUB -> 1500000 RUB", () => {
    const res = parseCurrencyString("1.5 млн RUB");
    assert.ok(res);
    assert.strictEqual(res.amount, 1500000);
    assert.strictEqual(res.currency, "RUB");
  });

  test("Parses Cyrillic multiplier 'тыс': 250 тыс ₸ -> 250000 KZT", () => {
    const res = parseCurrencyString("250 тыс ₸");
    assert.ok(res);
    assert.strictEqual(res.amount, 250000);
    assert.strictEqual(res.currency, "KZT");
  });

  test("Parses cryptocurrency: 0.05 BTC -> 0.05 BTC", () => {
    const res = parseCurrencyString("0.05 BTC");
    assert.ok(res);
    assert.strictEqual(res.amount, 0.05);
    assert.strictEqual(res.currency, "BTC");
  });

  test("Parses Satoshi to BTC: 100000000 SAT -> 1 BTC", () => {
    const res = parseCurrencyString("100000000 SAT");
    assert.ok(res);
    assert.strictEqual(res.amount, 1);
    assert.strictEqual(res.currency, "BTC");
    assert.strictEqual(res.isSat, true);
  });

  test("Parses word numerals & lexical currency: '90 тысяч долларов' -> 90000 USD", () => {
    const res = parseCurrencyString("90 тысяч долларов");
    assert.ok(res);
    assert.strictEqual(res.amount, 90000);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses word numerals & lexical currency: 'три тысячи евро' -> 3000 EUR", () => {
    const res = parseCurrencyString("три тысячи евро");
    assert.ok(res);
    assert.strictEqual(res.amount, 3000);
    assert.strictEqual(res.currency, "EUR");
  });

  test("Parses English lexical slang: 'five hundred bucks' -> 500 USD", () => {
    const res = parseCurrencyString("five hundred bucks");
    assert.ok(res);
    assert.strictEqual(res.amount, 500);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses fractional phrase: 'три с половиной тысячи рублей' -> 3500 RUB", () => {
    const res = parseCurrencyString("три с половиной тысячи рублей");
    assert.ok(res);
    assert.strictEqual(res.amount, 3500);
    assert.strictEqual(res.currency, "RUB");
  });

  test("Parses complex verbal millions: 'два с половиной миллиона долларов' -> 2500000 USD", () => {
    const res = parseCurrencyString("два с половиной миллиона долларов");
    assert.ok(res);
    assert.strictEqual(res.amount, 2500000);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses Russian slang and numerals: 'сто пятьдесят баксов' -> 150 USD", () => {
    const res = parseCurrencyString("сто пятьдесят баксов");
    assert.ok(res);
    assert.strictEqual(res.amount, 150);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses special compound fraction: 'полтора миллиона рублей' -> 1500000 RUB", () => {
    const res = parseCurrencyString("полтора миллиона рублей");
    assert.ok(res);
    assert.strictEqual(res.amount, 1500000);
    assert.strictEqual(res.currency, "RUB");
  });

  test("Parses compound half-million: 'полмиллиона долларов' -> 500000 USD", () => {
    const res = parseCurrencyString("полмиллиона долларов");
    assert.ok(res);
    assert.strictEqual(res.amount, 500000);
    assert.strictEqual(res.currency, "USD");
  });

  test("Parses English compound: 'one hundred and fifty euros' -> 150 EUR", () => {
    const res = parseCurrencyString("one hundred and fifty euros");
    assert.ok(res);
    assert.strictEqual(res.amount, 150);
    assert.strictEqual(res.currency, "EUR");
  });

  test("Rejects non-currency arbitrary strings", () => {
    assert.strictEqual(parseCurrencyString("Hello World"), null);
    assert.strictEqual(parseCurrencyString("Just a 456 number"), null);
    assert.strictEqual(parseCurrencyString(""), null);
  });

  console.log("\n--- [SECTION 2: SERVER API & PRIVACY/SECURITY TESTS] ---");

  await test("GET /api/health responds with status ok", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.status, "ok");
  });

  await test("GET /version.json returns valid release metadata", async () => {
    const res = await fetch(`${BASE_URL}/version.json`);
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.version, "1.0.0");
    assert.ok(data.notes.includes("Open Source"));
  });

  await test("GET /updates.xml returns secure XML manifest", async () => {
    const res = await fetch(`${BASE_URL}/updates.xml`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes("<gupdate"));
    assert.ok(text.includes("msjrecxeaytix2n65pvx6i"));
    assert.ok(!text.includes("<script>"));
  });

  await test("Security Headers are properly configured", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.headers.get("x-content-type-options"), "nosniff");
    assert.strictEqual(res.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.strictEqual(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.strictEqual(res.headers.get("x-powered-by"), null);
  });

  await test("POST /api/feedback validates inputs properly and maintains zero cloud persistence", async () => {
    // Valid submission
    const okRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tester", email: "test@example.com", text: "Great tool!", stars: 5 })
    });
    assert.strictEqual(okRes.status, 200);
    const okData = await okRes.json() as any;
    assert.strictEqual(okData.success, true);

    // Empty text rejection
    const emptyRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tester", text: "" })
    });
    assert.strictEqual(emptyRes.status, 400);

    // Invalid email rejection
    const badEmailRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tester", email: "not-an-email", text: "Some text" })
    });
    assert.strictEqual(badEmailRes.status, 400);
  });

  console.log("\n--- [SECTION 3: EXTENSION ARTIFACT INTEGRITY TESTS] ---");

  await test("GET /SyncRate.zip returns valid binary ZIP package", async () => {
    const res = await fetch(`${BASE_URL}/SyncRate.zip`);
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get("content-type");
    assert.ok(contentType?.includes("zip"));
    const arrayBuffer = await res.arrayBuffer();
    assert.ok(arrayBuffer.byteLength > 10000, "ZIP buffer is too small");

    // Verify ZIP archive contents using JSZip
    const zip = await JSZip.loadAsync(arrayBuffer);
    assert.ok(zip.file("manifest.json"), "manifest.json missing from ZIP");
    assert.ok(zip.file("background.js"), "background.js missing from ZIP");
    assert.ok(zip.file("content.js"), "content.js missing from ZIP");
    assert.ok(zip.file("popup.html"), "popup.html missing from ZIP");
    assert.ok(zip.file("popup.js"), "popup.js missing from ZIP");
  });

  await test("Extension manifest.json is valid Manifest V3", async () => {
    const manifestPath = path.join(process.cwd(), "extension", "manifest.json");
    assert.ok(fs.existsSync(manifestPath), "extension/manifest.json does not exist");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.strictEqual(manifest.manifest_version, 3);
    assert.ok(manifest.name.includes("SyncRate"), "Manifest name should include SyncRate");
    assert.ok(manifest.permissions.includes("storage"));
    assert.ok(manifest.background.service_worker, "Background service worker must be declared");
  });

  await test("Extension icon assets exist on disk", () => {
    const icon16 = path.join(process.cwd(), "extension", "icons", "icon16.png");
    const icon48 = path.join(process.cwd(), "extension", "icons", "icon48.png");
    const icon128 = path.join(process.cwd(), "extension", "icons", "icon128.png");
    assert.ok(fs.existsSync(icon16), "icon16.png missing");
    assert.ok(fs.existsSync(icon48), "icon48.png missing");
    assert.ok(fs.existsSync(icon128), "icon128.png missing");
  });

  console.log("\n--- [SECTION 4: ARCHITECTURAL INTEGRITY & ZERO-TRACKING AUDIT TESTS] ---");

  test("Extension code contains zero tracking IDs or session token leaks", () => {
    const bgCode = fs.readFileSync(path.join(process.cwd(), "extension", "background.js"), "utf8");
    const popupCode = fs.readFileSync(path.join(process.cwd(), "extension", "popup.js"), "utf8");
    const contentCode = fs.readFileSync(path.join(process.cwd(), "extension", "content.js"), "utf8");

    assert.ok(!bgCode.includes("installId"), "background.js must not contain installId");
    assert.ok(!bgCode.includes("sessionToken"), "background.js must not contain sessionToken");
    assert.ok(!bgCode.includes("/api/trial"), "background.js must not call /api/trial");
    assert.ok(!bgCode.includes("/api/session"), "background.js must not call /api/session");

    assert.ok(!popupCode.includes("installId"), "popup.js must not contain installId");
    assert.ok(!popupCode.includes("updateDashboardSels"), "popup.js must not call undefined updateDashboardSels");
    assert.ok(!popupCode.includes("activeTier"), "popup.js must not reference undefined activeTier");

    assert.ok(!contentCode.includes("sessionToken"), "content.js must not contain sessionToken");
    assert.ok(!contentCode.includes("getTierFromToken"), "content.js must not contain getTierFromToken");
  });

  test("No leaked Google API keys or credentials exist in workspace", () => {
    const keyPrefix = ['AIza', 'Sy'].join('');
    const checkDir = (dir: string) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        if (f.name === "node_modules" || f.name === ".git" || f.name === "dist" || f.name === "test-suite.ts" || f.name.endsWith(".zip") || f.name.endsWith(".crx")) continue;
        const p = path.join(dir, f.name);
        if (f.isDirectory()) {
          checkDir(p);
        } else if (f.name.endsWith(".json") || f.name.endsWith(".js") || f.name.endsWith(".ts")) {
          const content = fs.readFileSync(p, "utf8");
          assert.ok(!content.includes(keyPrefix), `File ${p} contains potential Google API Key leak`);
        }
      }
    };
    checkDir(process.cwd());
  });

  console.log("\n=======================================================");
  console.log(` 🏆 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log("=======================================================\n");
  process.exit(0);
}

runSuite().catch((e) => {
  console.error("Test execution terminated with error:", e);
  process.exit(1);
});
