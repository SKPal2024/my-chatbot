import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// AI and News API settings
// -------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const NEWS_API_KEY = "your own API key"; 
const NEWS_ENDPOINT = "https://newsapi.org/v2/everything";

// -------------------------------
// Fetch Wikipedia info
// -------------------------------
async function fetchWikipedia(topic) {
  try {
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(topic)}&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return null;
    return pages[pageId].extract || null;
   } catch (err) {
    console.error("Wikipedia fetch error:", err);
    return null;
  }
}

// -------------------------------
// Fetch News about topic
// -------------------------------
async function fetchNews(topic) {
  try {
    const url = `${NEWS_ENDPOINT}?q=${encodeURIComponent(topic)}&apiKey=${NEWS_API_KEY}&pageSize=3&sortBy=publishedAt`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles) return null;

    // Return first 3 headlines
    return data.articles.map(a => `${a.title} (${a.source.name})`).join("\n");
  } catch (err) {
    console.error("News fetch error:", err);
    return null;
  }
}

// -------------------------------
// Chat endpoint
// -------------------------------
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.json({ reply: "⚠️ No message provided." });

  try {
    // 1️⃣ Fetch context from Wikipedia and News
    const wikiInfo = await fetchWikipedia(userMessage);
    const newsInfo = await fetchNews(userMessage);

    // 2️⃣ Prepare the prompt with the fetched context
    let prompt = `You are an AI assistant. Your goal is to provide a helpful and well-structured answer. Use the provided information from Wikipedia and news to answer the user's question. If the provided information is not sufficient, respond by saying you couldn't find enough details.
    
    --- Context ---
    `;

    if (wikiInfo) {
      prompt += `\n📘 Wikipedia:\n${wikiInfo}\n`;
    }
    if (newsInfo) {
      prompt += `\n📰 News Headlines:\n${newsInfo}\n`;
    }
    if (!wikiInfo && !newsInfo) {
      prompt += "No specific information was found. Respond creatively and politely.";
    }
    
    prompt += `\n--- User's Message ---\n${userMessage}`;

    // 3️⃣ Send the prompt to the Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error("AI or other API error:", err);
    res.json({ reply: "⚠️ Error: The chatbot service is currently unavailable. Please try again later." });
  }
});

// -------------------------------
// Start server
// -------------------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
