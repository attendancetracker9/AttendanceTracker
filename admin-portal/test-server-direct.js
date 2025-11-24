/**
 * Direct test of the server routes
 * Run this to verify routes are working
 */

import express from "express";

const app = express();

// Simple test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Test server working!" });
});

app.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Test route working!" });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server on http://localhost:${PORT}`);
  console.log("If this works, the issue is with the main server");
});

