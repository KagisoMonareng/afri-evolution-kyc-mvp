const express = require('express');
const router = express.Router();
const { uploadFile } = require('../../backend/controllers/uploadController');

// @route   POST /upload
// @desc    Uploads a single file
// @access  Public
router.post('/', uploadFile);

module.exports = router;
