const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/", (req, res) => {
  res.send("<h1>✅ Text Redaction Backend</h1>");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend is running on port " + PORT,
    timestamp: new Date().toISOString()
  });
});

// Redaction functions
const applyFullMask = (text) => "X".repeat(text.length);

const applyPartialMask = (text) => {
  if (text.length <= 4) return "X".repeat(text.length);
  return "*".repeat(text.length - 4) + text.slice(-4);
};

const applyTokenReplacement = (text, type) => {
  const tokens = {
    "EMAIL": "<EMAIL>",
    "PHONE": "<PHONE>", 
    "ID": "<ID>",
    "SSN": "<SSN>",
    "ACCOUNT": "<ACCOUNT>"
  };
  return tokens[type] || "<REDACTED>";
};

// Main redaction endpoint
app.post("/redact", (req, res) => {
  console.log("📥 Redaction request received");
  
  try {
    const { text, spans } = req.body;
    
    // Validate
    if (!text || typeof text !== "string") {
      return res.status(400).json({ 
        success: false, 
        error: "Text is required and must be a string" 
      });
    }
    
    if (!spans || !Array.isArray(spans)) {
      return res.status(400).json({ 
        success: false, 
        error: "Spans must be an array" 
      });
    }
    
    console.log("Text length:", text.length);
    console.log("Spans:", spans.length);
    
    // Process spans
    const validSpans = [];
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const start = Number(span.start);
      const end = Number(span.end);
      const type = span.type || "EMAIL";
      const rule = span.rule || "FULL";
      
      // Validate
      if (isNaN(start) || isNaN(end)) {
        console.log(`Span ${i}: Invalid numbers`);
        continue;
      }
      
      if (start < 0 || end > text.length) {
        console.log(`Span ${i}: Out of bounds`);
        continue;
      }
      
      if (start >= end) {
        console.log(`Span ${i}: Start >= End`);
        continue;
      }
      
      validSpans.push({ start, end, type, rule });
      console.log(`Span ${i}: Valid - "${text.substring(start, end)}"`);
    }
    
    // Sort right to left
    validSpans.sort((a, b) => b.start - a.start);
    
    let redactedText = text;
    
    // Apply redactions
    for (const span of validSpans) {
      const original = text.substring(span.start, span.end);
      let masked;
      
      switch (span.rule.toUpperCase()) {
        case "FULL":
          masked = applyFullMask(original);
          break;
        case "PARTIAL":
          masked = applyPartialMask(original);
          break;
        case "TOKEN":
          masked = applyTokenReplacement(original, span.type);
          break;
        default:
          masked = applyFullMask(original);
      }
      
      redactedText = redactedText.substring(0, span.start) + 
                     masked + 
                     redactedText.substring(span.end);
      
      console.log(`Redacted: "${original}" → "${masked}"`);
    }
    
    console.log("✅ Final:", redactedText);
    
    // Send response
    res.json({
      success: true,
      redactedText: redactedText,
      metadata: {
        originalLength: text.length,
        redactedLength: redactedText.length,
        redactionsApplied: validSpans.length
      }
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error",
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("========================================");
  console.log("🚀 Text Redaction Backend STARTED");
  console.log("========================================");
  console.log("✅ Port: " + PORT);
  console.log("✅ Health: http://localhost:" + PORT + "/health");
  console.log("🔗 Frontend: http://localhost:5173");
  console.log("========================================");
  console.log("Waiting for requests...");
  console.log("========================================");
});