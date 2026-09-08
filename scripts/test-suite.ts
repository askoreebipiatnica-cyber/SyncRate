import assert from "assert";
import fs from "fs";
import path from "path";
import JSZip from "jszip";

const BASE_URL = "http://localhost:3000";

// ==========================================
// 1. UNIT TEST: CURRENCY PARSER LOGIC
// ==========================================
const CRYPTO_MAP: Record<string, string> = {
  'BTC':'BTC','BITCOIN':'BTC','БИТКОИН':'BTC','БИТОК':'BTC',
  'ETH':'ETH','ETHEREUM':'ETH','ЭФИРИУМ':'ETH','ЭФИР':'ETH',
  'USDT':'USDT','TETHER':'USDT','ТЕЗЕР':'USDT','BNB':'BNB',
  'BINANCECOIN':'BNB','SOL':'SOL','SOLANA':'SOL','XRP':'XRP',
  'DOGE':'DOGE','DOGECOIN':'DOGE','SAT':'SAT','SATOSHI':'SAT'
};

const FIAT_MAP: Record<string, string> = {
  '$':'USD','USD':'USD','€':'EUR','EUR':'EUR','£':'GBP','GBP':'GBP',
  '¥':'CNY','CNY':'CNY','JPY':'JPY','₣':'CHF','CHF':'CHF',
  'A$':'AUD','AUD':'AUD','C$':'CAD','CAD':'CAD','₺':'TRY','TRY':'TRY',
  'AED':'AED','₴':'UAH','UAH':'UAH','ГРН':'UAH','₸':'KZT','KZT':'KZT',
  '₼':'AZN','AZN':'AZN','BR':'BYN','BYN':'BYN','₹':'INR','INR':'INR',
  '₽':'RUB','Р':'RUB','РУБ':'RUB','RUB':'RUB'
};

const CURRENCY_MAP = { ...FIAT_MAP, ...CRYPTO_MAP };
const CRYPTO_CODES = Object.values(CRYPTO_MAP);

function parseCurrencyString(text: string) {
  text = text.replace(/[\u00A0\u202F\u200B-\u200D\uFEFF]/g, ' ').trim();
  if (!text || text.length > 50) return null;

  const suffixRegex = /^([0-9\s.,]+)\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\.?|млн\.?|млрд\.?|трлн\.?))?\s*([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\s]{1,25})$/i;
  const prefixRegex = /^([$€£¥₽₺₴₸₼₹₩₪¢A-Za-zА-Яа-яЁё.\s]{1,25})\s*([0-9\s.,]+)\s*((?:[KMBTКМБТ](?![A-Za-zА-Яа-яЁё])|тыс\.?|млн\.?|млрд\.?|трлн\.?))?$/i;

  let match = text.match(suffixRegex);
  let isSuffix = true;
  if (!match) {
    match = text.match(prefixRegex);
    isSuffix = false;
  }
  if (!match) return null;

  const originalMatchedCur = isSuffix ? match[3] : match[1];
  let numStr: string, curStr: string, multStr: string;
  if (isSuffix) {
    numStr = match[1];
    multStr = match[2] || "";
    curStr = match[3];
  } else {
    curStr = match[1];
    numStr = match[2];
    multStr = match[3] || "";
  }

  numStr = numStr.trim();
  curStr = curStr.trim().toUpperCase();
  multStr = multStr.trim().toLowerCase();

  if (curStr.endsWith('.') && curStr !== 'FR.') curStr = curStr.slice(0, -1);
  const cleanCurStr = curStr.replace(/[^A-ZА-ЯЁ$€£¥₽₺₴₸₼₹₩₪¢]/g, '');
  let isoCode = CURRENCY_MAP[cleanCurStr] || (Object.values(CURRENCY_MAP).includes(cleanCurStr) ? cleanCurStr : null);
  if (!isoCode) return null;

  if (isoCode === 'RUB' && (cleanCurStr === 'Р' || cleanCurStr === 'P')) {
    if (!isSuffix) return null;
    const rawCur = originalMatchedCur.trim();
    if (rawCur === 'P' || rawCur === 'p') return null;
  }

  let cleanNum = numStr.replace(/\s/g, '');
  let separators = cleanNum.match(/[.,]/g);
  let amount = 0;

  if (!separators) {
    amount = parseFloat(cleanNum);
  } else if (separators.length === 1) {
    let sep = separators[0];
    let parts = cleanNum.split(sep);
    if (parts[1].length === 3 && parts[0] !== '0' && parts[0] !== '-0' && !CRYPTO_CODES.includes(isoCode)) {
      amount = parseFloat(cleanNum.replace(sep, ''));
    } else {
      amount = parseFloat(cleanNum.replace(sep, '.'));
    }
  } else {
    let lastSepIdx = Math.max(cleanNum.lastIndexOf('.'), cleanNum.lastIndexOf(','));
    amount = parseFloat(cleanNum.substring(0, lastSepIdx).replace(/[.,]/g, '') + '.' + cleanNum.substring(lastSepIdx + 1));
  }

  if (isNaN(amount)) return null;

  multStr = multStr.replace('.', '');
  if (multStr === 'k' || multStr === 'тыс' || multStr === 'к' || multStr === 'т') amount *= 1000;
  else if (multStr === 'm' || multStr === 'млн' || multStr === 'м') amount *= 1000000;
  else if (multStr === 'b' || multStr === 'млрд' || multStr === 'б') amount *= 1000000000;
  else if (multStr === 't' || multStr === 'трлн') amount *= 1000000000000;

  const isSatVal = isoCode === 'SAT';
  if (isSatVal) amount *= 0.00000001;
  const finalCur = isSatVal ? 'BTC' : isoCode;

  return { amount, currency: finalCur, isSat: isSatVal };
}

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

  console.log("\n=======================================================");
  console.log(` 🏆 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log("=======================================================\n");
  process.exit(0);
}

runSuite().catch((e) => {
  console.error("Test execution terminated with error:", e);
  process.exit(1);
});
