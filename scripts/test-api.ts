import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("\n==================================================");
  console.log("   SYNC_RATE OPEN SOURCE INTEGRATION TEST SUITE   ");
  console.log("==================================================\n");

  try {
    // 1. Health Check
    console.log("⏳ [Test 1] Checking system health...");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json() as any;
    assert.strictEqual(healthRes.status, 200, "Health endpoint returned non-200 status.");
    assert.strictEqual(healthData.status, "ok", "System health report is not OK.");
    console.log("✅ [Test 1] System reports healthy state!\n");

    // 2. Version Check
    console.log("⏳ [Test 2] Fetching version info...");
    const versionRes = await fetch(`${BASE_URL}/version.json`);
    const versionData = await versionRes.json() as any;
    assert.strictEqual(versionRes.status, 200, "Version endpoint failed.");
    assert.ok(versionData.version, "Missing version field.");
    console.log(`   🔸 Current Version: ${versionData.version}`);
    console.log("✅ [Test 2] Version data fetched successfully!\n");

    // 3. XML Manifest Updates Check
    console.log("⏳ [Test 3] Requesting updates.xml manifest...");
    const xmlRes = await fetch(`${BASE_URL}/updates.xml`);
    const xmlText = await xmlRes.text();
    assert.strictEqual(xmlRes.status, 200, "Updates endpoint failed.");
    assert.ok(xmlText.includes("<gupdate"), "Updates XML does not contain google update tag.");
    console.log("✅ [Test 3] Chrome update manifest validated successfully!\n");

    // 4. Feedback Submission
    console.log("⏳ [Test 4] Sending community feedback...");
    const feedbackPayload = {
      name: "Open Source Tester",
      email: "tester@syncrate.org",
      text: "SyncRate is an excellent open-source project! Keep up the great work.",
      stars: 5
    };
    const feedbackRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackPayload)
    });
    const feedbackData = await feedbackRes.json() as any;
    assert.strictEqual(feedbackRes.status, 200, "Feedback API returned non-200 status.");
    assert.strictEqual(feedbackData.success, true, "Feedback submission failed.");
    console.log("✅ [Test 4] Feedback successfully submitted and verified!\n");

    // 5. ZIP & CRX Fallback Downloads
    console.log("⏳ [Test 5] Verifying download access for extension assets...");
    const zipRes = await fetch(`${BASE_URL}/SyncRate.zip`);
    const crxRes = await fetch(`${BASE_URL}/SyncRate.crx`);
    assert.ok([200, 404].includes(zipRes.status), "Unexpected status for ZIP download.");
    assert.ok([200, 404].includes(crxRes.status), "Unexpected status for CRX download.");
    console.log("✅ [Test 5] Extension download paths are fully accessible!\n");

    console.log("==================================================");
    console.log(" 🎉 SUCCESS: ALL OPEN-SOURCE INTEGRATION TESTS PASSED!");
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
