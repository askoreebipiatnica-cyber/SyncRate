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

    // 2. Инициация транзакции чекаута и симуляция оплаты (Checkout & Webhook flow)
    console.log("⏳ [Test 2] Initiating secure checkout and simulating payment...");
    const initiatePayload = {
      amount: "5.00",
      isProPlus: false,
      isDonation: false,
      email: "test-buyer@example.com",
      paymentMethod: "global"
    };

    const initiateRes = await fetch(`${BASE_URL}/api/initiate-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(initiatePayload)
    });

    const initiateData = await initiateRes.json() as any;
    assert.strictEqual(initiateRes.status, 200, "Initiate checkout failed.");
    assert.strictEqual(initiateData.success, true, "Could not call initiate checkout endpoint.");
    const transactionId = initiateData.transactionId;
    assert.ok(transactionId, "Missing transactionId in checkout response.");
    console.log(`   🔸 Created pending transaction: "${transactionId}"`);

    // Симулируем успешный вебхук
    console.log("   ⏳ Simulating successful payment webhook...");
    const webhookRes = await fetch(`${BASE_URL}/api/simulate-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId })
    });
    const webhookData = await webhookRes.json() as any;
    assert.strictEqual(webhookRes.status, 200, "Simulated webhook failed.");
    assert.strictEqual(webhookData.success, true, "Webhook simulation returned success: false.");

    // Опрашиваем статус платежа, чтобы получить сгенерированный ключ
    console.log("   ⏳ Fetching payment status and generated license key...");
    const statusRes = await fetch(`${BASE_URL}/api/check-payment-status?transactionId=${transactionId}`);
    const statusData = await statusRes.json() as any;
    assert.strictEqual(statusRes.status, 200, "Check payment status failed.");
    assert.strictEqual(statusData.status, "completed", "Payment transaction was not completed.");
    
    const formedKey = statusData.licenseKey;
    console.log(`   🔸 Server generated key: "${formedKey}"`);

    assert.ok(formedKey, "License key was not generated.");
    // Ключ должен соответствовать паттерну PRO-XXXXXX (длина 10, префикс PRO)
    assert.ok(/^[A-Z0-9]{3,4}-[A-Z0-9]{6}$/.test(formedKey), "Key format does not match [PREFIX]-[HEX6] pattern.");
    assert.ok(formedKey.startsWith("PRO-"), "Expected PRO key, but got another tier prefix.");
    console.log("✅ [Test 2] Security checkout flow completed successfully and generated a valid license!\n");

    // 3. Тест верификации ликвидного ключа (O(1) Oozing check)
    console.log(`⏳ [Test 3] Verifying generated key "${formedKey}" dynamically...`);
    const verifyPayload = { licenseKey: formedKey, installId: "inst-testdevice1234567890" };
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
    const badVerifyPayload = { licenseKey: "PRO-ABCDEF", installId: "inst-testdevice1234567890" };
    const badVerifyRes = await fetch(`${BASE_URL}/api/verify-license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badVerifyPayload)
    });

    const badVerifyData = await badVerifyRes.json() as any;
    assert.strictEqual(badVerifyRes.status, 200);
    assert.strictEqual(badVerifyData.success, false, "Fake license accepted as valid!");
    assert.strictEqual(badVerifyData.error, "Key not found", "Incorrect error description received.");
    console.log("✅ [Test 4] Rejection behavior verified successfully!\n");

    // 5. Тест несоответствия суммы платежа тарифу (Amount mismatch)
    console.log("⏳ [Test 5] Checking billing / amount mismatch protection...");
    const badAmountPayload = {
      amount: "2.00", // Попытка купить PRO (который теперь стоит 5.00) за 2.00$
      isProPlus: false,
      isDonation: false,
      email: "test-mismatch@example.com",
      paymentMethod: "global"
    };

    const badAmountRes = await fetch(`${BASE_URL}/api/initiate-checkout`, {
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
