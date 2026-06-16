import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("\n==================================================");
  console.log("   SYNC_RATE INTEGRATION & SECURITY TEST SUITE    ");
  console.log("==================================================\n");

  try {
    // 1. Тест работоспособности API (Health Check)
    console.log("⏳ [Test 1] Checking system health...");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json() as any;
    assert.strictEqual(healthRes.status, 200, "Health endpoint returned non-200 status.");
    assert.strictEqual(healthData.status, "ok", "System health report is not OK.");
    console.log("✅ [Test 1] System reports healthy state!\n");

    // 2. Тест защиты при создании лицензии (Client inputs override prevention)
    console.log("⏳ [Test 2] Verifying client-side key override protection...");
    const createPayload = {
      amount: "5.00",
      isProPlus: false,
      isDonation: false,
      key: "PRO-HACKED", // Попытка форсировать свой ключ, переданный от клиента
      license: "PLUS-HACKED" // Альтернативный заголовок хакерской атаки
    };

    const createRes = await fetch(`${BASE_URL}/api/create-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload)
    });

    const createData = await createRes.json() as any;
    assert.strictEqual(createRes.status, 200, "Create license failed.");
    assert.strictEqual(createData.success, true, "Could not call create license endpoint.");
    
    const formedKey = createData.license;
    console.log(`   🔸 Server generated key: "${formedKey}"`);

    // Ключ должен быть сгенерирован СЕРВЕРОМ, а не взломан клиентом
    assert.notStrictEqual(formedKey, "PRO-HACKED", "CRITICAL SECURITY BREACH: Client-side keys are accepted directly!");
    assert.notStrictEqual(formedKey, "PLUS-HACKED", "CRITICAL SECURITY BREACH: Client-side keys are accepted directly!");
    
    // Ключ должен соответствовать паттерну PRO-XXXXXX (длина 10, префикс PRO)
    assert.ok(/^[A-Z0-9]{3,4}-[A-Z0-9]{6}$/.test(formedKey), "Key format does not match [PREFIX]-[HEX6] pattern.");
    assert.ok(formedKey.startsWith("PRO-"), "Expected PRO key, but got another tier prefix.");
    console.log("✅ [Test 2] Security shield handles client override attempt successfully!\n");

    // 3. Тест верификации ликвидного ключа (O(1) Oozing check)
    console.log(`⏳ [Test 3] Verifying generated key "${formedKey}" dynamically...`);
    const verifyPayload = { licenseKey: formedKey };
    const verifyRes = await fetch(`${BASE_URL}/api/verify-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verifyPayload)
    });

    const verifyData = await verifyRes.json() as any;
    assert.strictEqual(verifyRes.status, 200, "License verification endpoint failed.");
    assert.strictEqual(verifyData.success, true, "Valid generated key was rejected by verify agent.");
    assert.strictEqual(verifyData.tier, "pro", "Key tier mismatch in DB record.");
    console.log("✅ [Test 3] Active license verified successfully!\n");

    // 4. Тест отклонения фейкового ключа
    console.log("⏳ [Test 4] Verifying security rejection of fake signature...");
    const badVerifyPayload = { licenseKey: "PRO-NONEXISTENT" };
    const badVerifyRes = await fetch(`${BASE_URL}/api/verify-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badVerifyPayload)
    });

    const badVerifyData = await badVerifyRes.json() as any;
    assert.strictEqual(badVerifyRes.status, 200);
    assert.strictEqual(badVerifyData.success, false, "Fake license accepted as valid!");
    assert.strictEqual(badVerifyData.error, "Invalid license key", "Incorrect error description received.");
    console.log("✅ [Test 4] Rejection behavior verified successfully!\n");

    // 5. Тест несоответствия суммы платежа тарифу (Amount mismatch)
    console.log("⏳ [Test 5] Checking billing / amount mismatch protection...");
    const badAmountPayload = {
      amount: "2.00", // Попытка купить PRO (который теперь стоит 5.00) за 2.00$
      isProPlus: false,
      isDonation: false
    };

    const badAmountRes = await fetch(`${BASE_URL}/api/create-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badAmountPayload)
    });

    const badAmountData = await badAmountRes.json() as any;
    assert.strictEqual(badAmountRes.status, 400, "Expected status code 400 due to bad amount.");
    assert.strictEqual(badAmountData.success, false);
    assert.strictEqual(badAmountData.error, "Invoice/Amount mismatch for the requested tier type.");
    console.log("✅ [Test 5] Billing verification blocks underpayment attempts!\n");

    console.log("==================================================");
    console.log(" 🎉  SUCCESS: ALL SECURITY & INTEGRATION TESTS PASSED! ");
    console.log("==================================================\n");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ CRITICAL INTEGRATION TEST FAILURE:");
    console.error(error.message || error);
    console.log("\n==================================================");
    process.exit(1);
  }
}

runTests();
