/*
This controller handles file uploads for the KYC Pack Generator.
Accepts multipart/form-data with two files: ID document and Proof of Address.
Allowed types: PDF, PNG, JPG. Max size: 5MB each.
Files are saved to /uploads directory with UUID names.

On success: returns 200 with file references and metadata.
On failure: returns 400 with validation error messages.

This module will be called by the /upload API route.
*/

const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: File type not supported. Only PDF, PNG, and JPG are allowed.'), false);
  }
};

// Initialize upload variable with multer configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter
}).single('document'); // 'document' is the name of the input field in the form

// Upload controller logic
const uploadFile = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: `Multer Error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ message: err.message });
    }

    // Check if file is present
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected for upload.' });
    }

    // Everything went fine, file is uploaded
    res.status(200).json({
      message: 'File uploaded successfully.',
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      }
    });
  });
};

module.exports = {
  uploadFile
};
