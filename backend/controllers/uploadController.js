// backend/controllers/uploadController.js
/*
 * Afri Evolution – KYC Pack MVP
 * ------------------------------------------------------------
 * • Validates uploads (PDF | PNG | JPG  ≤ 5 MB)
 * • Saves files using UUIDs
 * • Runs hybrid OCR  (pdf-parse + Tesseract via agents/ocrAgent.js)
 * • Extracts entities with Compromise NER
 * • Tokenises every extracted value
 * • Returns files + token map in JSON response
 */

const multer  = require('multer');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const tokenizer = require('../../utils/tokenizer');
const {
  extractTextHybrid,
  extractEntities
} = require('../../agents/ocrAgent');

// ───────────────── Multer setup ─────────────────────────────
const storage = multer.diskStorage({
  destination: './uploads/',
  filename  : (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const allowed = /jpeg|jpg|png|pdf/;
const fileFilter = (req, file, cb) => {
  const okExt  = allowed.test(path.extname(file.originalname).toLowerCase());
  const okMime = allowed.test(file.mimetype);
  okExt && okMime
    ? cb(null, true)
    : cb(new Error('Unsupported type. Only PDF, PNG, JPG allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

const uploadFile = upload.fields([
  { name: 'id_doc',           maxCount: 1 },
  { name: 'proof_of_address', maxCount: 1 }
]);

// ───────────────── Controller ───────────────────────────────
const handleUpload = (req, res) => {
  uploadFile(req, res, async err => {
    if (err)       return res.status(400).json({ message: err.message });
    if (!req.files?.id_doc || !req.files?.proof_of_address)
      return res.status(400).json({ message: 'Both files are required.' });

    try {
      // OCR each file (hybrid: searchable text or raster-OCR)
      const idPath    = req.files.id_doc[0].path;
      const proofPath = req.files.proof_of_address[0].path;

      const idText    = await extractTextHybrid(idPath);
      const proofText = await extractTextHybrid(proofPath);

      // Entity extraction
      const idEnts    = extractEntities(idText);
      const proofEnts = extractEntities(proofText);

      // Tokenise every non-null value
      [
        ...idEnts.names,
        ...proofEnts.names,
        ...idEnts.id_numbers,
        ...proofEnts.id_numbers,
        idEnts.address,
        proofEnts.address,
        ...idEnts.dates,
        ...proofEnts.dates
      ]
        .filter(Boolean)
        .forEach(v => tokenizer.createToken(v));

      return res.status(200).json({
        message   : 'Files uploaded & OCR-tokenised',
        files     : req.files,
        token_map : tokenizer.tokenMap         // expose for MVP; hide in prod
      });
    } catch (ocrErr) {
      return res.status(500).json({ message: `OCR failure: ${ocrErr.message}` });
    }
  });
};

module.exports = { handleUpload };
