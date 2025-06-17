// backend/controllers/generatePackController.js
const path           = require('path');
const { buildKycPack } = require('../../utils/pdfBuilder');

// POST body expected: { id_file, proof_file, token_map }
const handleGeneratePack = (req, res) => {
  try {
    const { id_file, proof_file, token_map } = req.body;
    if (!id_file || !proof_file) {
      return res.status(400).json({ message: 'id_file and proof_file required.' });
    }

    const idPath    = path.join(__dirname, '..', '..', 'uploads', id_file);
    const proofPath = path.join(__dirname, '..', '..', 'uploads', proof_file);

    const { fileName } = buildKycPack({
      idPath,
      proofPath,
      tokenMap: token_map || { placeholder: 'John Doe' }
    });

    res.status(200).json({
      message : 'KYC Pack generated',
      download: `/downloads/${fileName}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleGeneratePack };
