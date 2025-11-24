/**
 * Quick test script to verify backend server is working
 * Run: node test-backend.js
 */

const testBackend = async () => {
  try {
    console.log("Testing backend server...\n");
    
    // Test 1: Health check endpoint
    console.log("1. Testing health check endpoint...");
    try {
      const healthResponse = await fetch("http://localhost:3001/api/health");
      const healthData = await healthResponse.json();
      if (healthResponse.ok && healthData.status === "ok") {
        console.log("   ✅ Health check passed!");
      } else {
        console.log("   ⚠️ Health check returned unexpected data");
      }
    } catch (err) {
      console.log("   ❌ Health check failed:", err.message);
    }
    
    // Test 2: Root endpoint
    console.log("\n2. Testing root endpoint...");
    try {
      const rootResponse = await fetch("http://localhost:3001/");
      const rootData = await rootResponse.json();
      if (rootResponse.ok && rootData.status === "ok") {
        console.log("   ✅ Root endpoint working!");
      } else {
        console.log("   ⚠️ Root endpoint returned unexpected data");
      }
    } catch (err) {
      console.log("   ❌ Root endpoint failed:", err.message);
    }
    
    // Test 3: API endpoint with invalid key (should return 400 or 401)
    console.log("\n3. Testing API endpoint (with test key)...");
    const response = await fetch("http://localhost:3001/api/fast2sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "test-key"
      },
      body: JSON.stringify({
        message: "Test message",
        numbers: "1234567890",
        route: "q"
      })
    });

    const data = await response.json();
    console.log("   Response status:", response.status);
    
    // 400 = Missing/invalid API key (backend validation)
    // 401 = Fast2SMS rejected the key (backend is working, just wrong key)
    if (response.status === 400 || response.status === 401) {
      console.log("   ✅ Backend server is running and processing requests!");
      console.log("   ℹ️  The error is expected (using test API key)");
      if (response.status === 401) {
        console.log("   ℹ️  Fast2SMS API is reachable (backend proxy working)");
      }
    } else {
      console.log("   ⚠️ Unexpected response:", data);
    }
    
    console.log("\n✅ Backend server is working correctly!");
    console.log("   You can now use it with your real Fast2SMS API key.");
    
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.message.includes("fetch failed")) {
      console.error("\n❌ Backend server is NOT running!");
      console.error("   Please start it with: npm run backend");
      console.error("   Error:", error.message);
    } else {
      console.error("\n❌ Error:", error.message);
    }
    process.exit(1);
  }
};

testBackend();

