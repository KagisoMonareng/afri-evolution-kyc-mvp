const express = require('express');
const router  = express.Router();
const { handleGeneratePack } =
  require('../backend/controllers/generatePackController');

// POST /api/generate_pack
router.post('/', express.json(), handleGeneratePack);

module.exports = router;
