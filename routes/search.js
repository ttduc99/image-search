const express = require('express');
const router = express.Router();
const axios = require('axios');
const Search = require('../models/Search');

router.get('/:searchTerm', async (req, res) => {
  const { searchTerm } = req.params;
  const page = req.query.page || 1;

  try {
    // Lưu recent search
    await Search.create({ term: searchTerm });

    // Gọi Unsplash API
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: searchTerm,
        page,
        per_page: 10
      },
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });

    const results = response.data.results.map(img => ({
      url: img.urls.small,
      description: img.alt_description,
      pageURL: img.links.html
    }));

    res.json(results);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
