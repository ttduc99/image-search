// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RECENT_FILE = path.join(__dirname, 'recent.json');
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

if (!UNSPLASH_KEY) {
  console.warn(
    'Warning: UNSPLASH_ACCESS_KEY not set. Set it in .env for real API calls.'
  );
}

// ensure recent file exists
if (!fs.existsSync(RECENT_FILE)) fs.writeFileSync(RECENT_FILE, '[]', 'utf8');

function readRecent() {
  try {
    const raw = fs.readFileSync(RECENT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writeRecent(arr) {
  fs.writeFileSync(RECENT_FILE, JSON.stringify(arr, null, 2), 'utf8');
}
function addRecent(query) {
  if (!query || query.trim() === '') return;
  const trimmed = query.trim();
  let arr = readRecent();
  // remove if exists then add to front
  arr = arr.filter((x) => x.toLowerCase() !== trimmed.toLowerCase());
  arr.unshift({ term: trimmed, when: new Date().toISOString() });
  arr = arr.slice(0, 10); // keep last 10
  writeRecent(arr);
}

// Endpoint: recent searches
app.get('/api/recent', (req, res) => {
  const arr = readRecent();
  // return simple format like freeCodeCamp: [{term, when}, ...]
  res.json(arr);
});

// Endpoint: query
// Example: GET /api/query/lolcats%20funny?page=2
app.get('/api/query/:searchTerm', async (req, res) => {
  const rawTerm = req.params.searchTerm || '';
  const page = parseInt(req.query.page || '1', 10);
  const perPage = 10;

  addRecent(rawTerm);

  try {
    if (!UNSPLASH_KEY) {
      // Fallback: return a mocked structure so you can test without API key
      const mock = Array.from({ length: perPage }, (_, i) => {
        const idx = (page - 1) * perPage + i + 1;
        return {
          url: `https://example.com/image/${encodeURIComponent(
            rawTerm
          )}/${idx}`,
          description: `${rawTerm} - mock image #${idx}`,
          page: `https://example.com/page/${encodeURIComponent(
            rawTerm
          )}/${idx}`,
        };
      });
      return res.json(mock);
    }

    // Use Unsplash Search Photos API
    const encoded = encodeURIComponent(rawTerm);
    const url = `https://api.unsplash.com/search/photos?query=${encoded}&page=${page}&per_page=${perPage}`;
    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
    if (!r.ok) {
      const text = await r.text();
      return res
        .status(502)
        .json({ error: 'Upstream API error', details: text });
    }
    const data = await r.json();
    const results = (data.results || []).map((item) => ({
      url:
        (item.urls &&
          (item.urls.raw ||
            item.urls.full ||
            item.urls.regular ||
            item.urls.small)) ||
        null,
      description:
        item.alt_description ||
        item.description ||
        (item.user && item.user.name) ||
        '',
      page:
        item.links && item.links.html
          ? item.links.html
          : item.user && item.user.links && item.user.links.html
          ? item.user.links.html
          : null,
    }));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// serve a simple static frontend (optional)
app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
