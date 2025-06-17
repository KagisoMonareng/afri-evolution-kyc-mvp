// api/upload.js
const express = require('express');
const router  = express.Router();
const { handleUpload } = require('../backend/controllers/uploadController'); // << change here

router.post('/', handleUpload, (req, res) => {                               // << and here
  try {
    // Confirm Multer stored both expected files
    if (!req.files?.id_doc || !req.files?.proof_of_address) {
      return res.status(400).json({ message: 'Files missing or not uploaded correctly.' });
    }

    res.status(200).json({
      message: 'Files uploaded successfully',
      files  : req.files
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
