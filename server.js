#!/usr/bin/env node
/**
 * Local server that serves the game and proxies Eleven Labs TTS so the
 * browser never calls the API directly (avoids CORS and keeps API key server-side).
 *
 * Run: node server.js
 * Then open http://localhost:3000/gfb.html
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const https = require("https");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname);

// Load API key and voice ID from environment variables.
// Locally, set them in a config.js or export them in your shell.
// On Render, set them in the Environment tab of your service.
function loadConfig() {
  let apiKey  = process.env.EL_API_KEY;
  let voiceId = process.env.EL_VOICE_ID;

  // Fallback: try reading from local config.js if env vars are missing
  if (!apiKey || !voiceId) {
    const configPath = path.join(ROOT, "config.js");
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf8");
      apiKey  = apiKey  || content.match(/EL_API_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1];
      voiceId = voiceId || content.match(/EL_VOICE_ID\s*=\s*['"]([^'"]+)['"]/)?.[1];
    }
  }

  if (!apiKey || !voiceId) {
    console.error("EL_API_KEY and EL_VOICE_ID must be set as environment variables.");
    process.exit(1);
  }
  return { apiKey, voiceId };
}

const { apiKey, voiceId } = loadConfig();

const MIMES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const mime = MIMES[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

function proxyTTS(body, res) {
  let text;
  try {
    const parsed = JSON.parse(body);
    text = parsed.text;
  } catch (_) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing or invalid JSON body with 'text'" }));
    return;
  }
  if (!text || typeof text !== "string") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Body must include 'text' (string)" }));
    return;
  }

  const postData = JSON.stringify({
    text,
    model_id: "eleven_turbo_v2_5",
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });
  const req = https.request(
    {
      hostname: "api.elevenlabs.io",
      path: `/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
        "Content-Length": Buffer.byteLength(postData),
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        "Content-Type": proxyRes.headers["content-type"] || "audio/mpeg",
      });
      proxyRes.pipe(res);
    }
  );
  req.on("error", (e) => {
    console.error("TTS proxy error:", e.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "TTS proxy failed: " + e.message }));
  });
  req.write(postData);
  req.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname === "/" ? "/gfb.html" : parsed.pathname;

  if (pathname === "/api/tts" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => proxyTTS(body, res));
    return;
  }

  const filePath = path.join(ROOT, pathname.replace(/^\//, ""));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Game server running at http://localhost:${PORT}/`);
  console.log(`Open http://localhost:${PORT}/gfb.html for the AI narrator.`);
});
