/**
 * Simple Express Server to Proxy Fast2SMS API Requests
 * This solves the CORS issue by making API calls from the server side
 * 
 * To run: node backend-server.js
 * Make sure to install dependencies: npm install express cors
 */

import express from "express";
import cors from "cors";

const app = express();

// Enable CORS FIRST - before any routes
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key", "authorization"]
}));

// Parse JSON bodies
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint - MUST be before 404 handler
app.get("/", (req, res) => {
  console.log("✅ Root endpoint accessed!");
  res.json({ 
    status: "ok", 
    message: "Fast2SMS Proxy Server is running",
    endpoint: "/api/fast2sms",
    healthCheck: "/api/health",
    version: "1.0.0"
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log("Health check endpoint hit!");
  res.setHeader("Content-Type", "application/json");
  res.json({ 
    status: "ok", 
    service: "Fast2SMS Proxy",
    timestamp: new Date().toISOString()
  });
});

// Proxy endpoint for Fast2SMS
app.post("/api/fast2sms", async (req, res) => {
  console.log("📨 Fast2SMS request received");
  try {
    const { message, numbers, route } = req.body;
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"];

    if (!apiKey) {
      console.error("❌ No API key provided");
      return res.status(400).json({
        return: false,
        message: ["API key is required"]
      });
    }

    if (!message || !numbers) {
      console.error("❌ Missing message or numbers");
      return res.status(400).json({
        return: false,
        message: ["Message and numbers are required"]
      });
    }

    console.log(`📤 Forwarding to Fast2SMS: ${numbers.split(",").length} numbers`);

    // Forward request to Fast2SMS
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message.trim(),
        numbers: numbers,
        route: route || "q"
      })
    });

    const data = await response.json();
    
    if (data.return === true) {
      console.log("✅ Fast2SMS request successful");
    } else {
      console.error("❌ Fast2SMS request failed:", data.message);
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ Fast2SMS Proxy Error:", error);
    res.status(500).json({
      return: false,
      message: [error.message || "Internal server error"]
    });
  }
});

// 404 handler for unknown routes (must be last)
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: ["/", "/api/health", "/api/fast2sms (POST)"]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Fast2SMS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to proxy requests to Fast2SMS API`);
  console.log(`🔗 Test: http://localhost:${PORT}/`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});

