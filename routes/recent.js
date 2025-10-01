const express = require('express');
const router = express.Router();
const Search = require('../models/Search');

router.get('/', async (req, res) => {
  try {
    const recentSearches = await Search.find()
      .sort({ when: -1 })
      .limit(10)
      .select({ term: 1, when: 1, _id: 0 });

    res.json(recentSearches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
