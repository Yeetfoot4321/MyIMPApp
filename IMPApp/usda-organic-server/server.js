const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const USDA_OID_SEARCH_URL = 'https://organic.ams.usda.gov/integrity/operations/search';

app.get('/check-usda-organic', async (req, res) => {
  const { brand } = req.query;
  if (!brand) return res.status(400).json({ error: 'Brand required' });

  try {
    const response = await axios.get(USDA_OID_SEARCH_URL, {
      params: { q: brand },
    });

    const $ = cheerio.load(response.data);
    let certified = false;

    $('table tr').each((i, row) => {
      const rowText = $(row).text().toLowerCase();
      if (rowText.includes(brand.toLowerCase())) {
        certified = true;
      }
    });

    res.json({ brand, certified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'USDA lookup failed' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
