import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const MAX_PAYLOAD_BYTES = 32768; // 32 KB
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 10;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Enforce POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  // Reject oversized payloads
  if (!event.body || event.body.length > MAX_PAYLOAD_BYTES) {
    return {
      statusCode: 413,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Payload too large. Maximum size is 32 KB.' })
    };
  }

  // Check API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Cloud AI service is not configured. Please set the GEMINI_API_KEY environment variable in Netlify settings.'
      })
    };
  }

  // Parse and validate JSON
  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON request body.' })
    };
  }

  // Extract user message (supports both 'message' and 'prompt')
  const userMessage = typeof parsed.message === 'string'
    ? parsed.message.trim()
    : typeof parsed.prompt === 'string'
    ? parsed.prompt.trim()
    : '';

  if (!userMessage) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Message cannot be empty.' })
    };
  }

  if (userMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`
      })
    };
  }

  // Build conversation history safely
  const contents = [];

  if (Array.isArray(parsed.history)) {
    const safeHistory = parsed.history.slice(-MAX_HISTORY_ITEMS);
    for (const item of safeHistory) {
      if (item && typeof item.text === 'string' && item.text.trim()) {
        const role = (item.sender === 'user' || item.role === 'user') ? 'user' : 'model';
        contents.push({
          role,
          parts: [{ text: item.text.slice(0, MAX_MESSAGE_LENGTH).trim() }]
        });
      }
    }
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Configurable model with sensible default
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  const systemInstruction = 
    "You are ORYQEN, a sophisticated, helpful voice assistant and tablet HUD companion. " +
    "Provide natural, concise spoken responses (1 to 3 sentences maximum) suitable for reading aloud via browser speech synthesis. " +
    "Do not use markdown formatting such as bolding (**text**), bullet points, asterisks, emojis, or code blocks, as your output is read aloud. " +
    "Answer user questions directly, accurately, and politely. " +
    "Do not claim to control real home hardware if not requested.";

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    let usedModel = modelName;
    let response;

    try {
      response = await ai.models.generateContent({
        model: usedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 180
        }
      });
    } catch (primaryErr) {
      const pMsg = primaryErr?.message || String(primaryErr);
      // If 503 spike or unavailable and no custom model specified, fallback to gemini-3.1-flash-lite
      if (!process.env.GEMINI_MODEL && (pMsg.includes('503') || pMsg.includes('UNAVAILABLE') || pMsg.includes('high demand'))) {
        usedModel = 'gemini-3.1-flash-lite';
        response = await ai.models.generateContent({
          model: usedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 180
          }
        });
      } else {
        throw primaryErr;
      }
    }

    const replyText = response.text ? response.text.trim() : '';

    if (!replyText) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Cloud AI returned an empty response. Please try again.' })
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        reply: replyText,
        model: usedModel
      })
    };
  } catch (err) {
    const errMsg = err?.message || String(err);

    // Rate limiting check
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      return {
        statusCode: 429,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Cloud AI rate limit reached. Please wait a moment and try again.'
        })
      };
    }

    // High demand / service unavailable check
    if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
      return {
        statusCode: 503,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Cloud AI is currently experiencing high demand. Please try again in a few moments.'
        })
      };
    }

    // Authentication failure check
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401') || errMsg.includes('403')) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Cloud AI authentication failed. Please verify the GEMINI_API_KEY in Netlify environment variables.'
        })
      };
    }

    // Generic safe error
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Unable to process request with Cloud AI at this time. Please try again.'
      })
    };
  }
};
