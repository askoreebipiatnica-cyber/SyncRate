/**
 * SyncRate - Background API Integration & Unit Tests
 * Tests for background service worker exchange rate resolution and crypto price fetching.
 *
 * @license Apache-2.0
 */

import assert from "assert";

// Load background script into runtime environment
await import("./background.js");
const { getCrossRate, getCryptoUsdPrice } = globalThis;

export async function runApiTests() {
  console.log("\n=======================================================");
  console.log("   🧪 SYNCRATE BACKGROUND API TESTS (V1.1.0) 🧪       ");
  console.log("=======================================================");

  let passed = 0;
  let total = 0;

  async function it(title, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${title}:`, err.message);
      throw err;
    }
  }

  // 1. Identity rate
  await it("Identity conversion returns rate = 1 and Live date", async () => {
    const res = await getCrossRate("USD", "USD", "market");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.rate, 1);
    assert.strictEqual(res.date, "Live");
  });

  // 2. Crypto USD price
  await it("getCryptoUsdPrice('BTC') returns valid positive number", async () => {
    const price = await getCryptoUsdPrice("BTC");
    assert.ok(typeof price === "number" && price > 0, `Expected positive number, got ${price}`);
  });

  // 3. Satoshi calculation
  await it("getCryptoUsdPrice('SAT') equals BTC price * 1e-8", async () => {
    const btcPrice = await getCryptoUsdPrice("BTC");
    const satPrice = await getCryptoUsdPrice("SAT");
    assert.ok(satPrice > 0, "SAT price must be > 0");
    const ratio = satPrice / btcPrice;
    assert.ok(Math.abs(ratio - 1e-8) < 1e-12, `Ratio ${ratio} should equal 1e-8`);
  });

  // 4. Fiat-to-Fiat conversion
  await it("getCrossRate('USD', 'EUR', 'market') resolves valid exchange rate", async () => {
    const res = await getCrossRate("USD", "EUR", "market");
    assert.strictEqual(res.success, true);
    assert.ok(typeof res.rate === "number" && res.rate > 0);
  });

  // 5. Crypto-to-Fiat conversion
  await it("getCrossRate('BTC', 'USD', 'market') returns BTC price in USD", async () => {
    const res = await getCrossRate("BTC", "USD", "market");
    assert.strictEqual(res.success, true);
    assert.ok(typeof res.rate === "number" && res.rate > 1000);
  });

  // 6. Fiat-to-Crypto conversion
  await it("getCrossRate('USD', 'BTC', 'market') returns inverse BTC price", async () => {
    const res = await getCrossRate("USD", "BTC", "market");
    assert.strictEqual(res.success, true);
    assert.ok(typeof res.rate === "number" && res.rate > 0 && res.rate < 0.01);
  });

  // 7. Crypto-to-Crypto conversion
  await it("getCrossRate('ETH', 'BTC', 'market') returns ratio of ETH to BTC", async () => {
    const res = await getCrossRate("ETH", "BTC", "market");
    assert.strictEqual(res.success, true);
    assert.ok(typeof res.rate === "number" && res.rate > 0);
  });

  // 8. Official bank rate with fallback
  await it("getCrossRate('USD', 'RUB', 'official') resolves rate with bank name or fallback", async () => {
    const res = await getCrossRate("USD", "RUB", "official");
    assert.strictEqual(res.success, true);
    assert.ok(typeof res.rate === "number" && res.rate > 0);
    assert.ok(res.date.includes("ЦБ РФ") || res.date === "Live" || res.fallback === true);
  });

  // 9. Official bank fallback caching
  await it("getCrossRate fallback for pair without official bank (e.g. USD -> KZT official) caches with fallback flag", async () => {
    const res = await getCrossRate("USD", "KZT", "official");
    assert.strictEqual(res.success, true);
    assert.ok(typeof res.rate === "number" && res.rate > 0);
    assert.strictEqual(res.fallback, true);
  });

  // 10. Graceful error handling for unknown currency
  await it("getCrossRate handles unknown currency gracefully", async () => {
    const res = await getCrossRate("INVALID_COIN_XYZ", "USD", "market");
    assert.strictEqual(res.success, false);
  });

  console.log("\n=======================================================");
  console.log(` 🏆 API TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log("=======================================================\n");
}

if (process.argv[1] && process.argv[1].endsWith("background.api.test.js")) {
  runApiTests().catch((e) => {
    console.error("API Tests failed:", e);
    process.exit(1);
  });
}
