require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.GEMINI_API_KEY;
const apiUri = process.env.GEMINI_API_URL;

async function askGemini(question) {
  try {
    const endpoint = `/v1/order/new`;
    const response = await axios.post(`${apiUri}${endpoint}`, {
      question: question,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

module.exports = { askGemini };
