const express = require('express');
const router = express.Router();
const axios = require('axios');

// This endpoint proxies requests to the Python-based Groq AI service
router.post('/', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    // Forward the Authorization header containing the JWT token
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const headers = {};
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Call the Python AI Service (Uvicorn) on port 8000
    const aiResponse = await axios.post('http://localhost:8000/ask', {
      query: query
    }, { headers });

    console.log("🤖 AI Response:", aiResponse.data);

    // The Python service already returns the required JSON structure
    res.json(aiResponse.data);

  } catch (err) {
    console.error("❌ AI Service Error:", err.message);
    
    // Fallback if the Python service is down
    res.json({
      type: "unknown",
      intent: "service_unavailable",
      response: "The AI Assistant is currently offline. Please try again later."
    });
  }
});

module.exports = router;
