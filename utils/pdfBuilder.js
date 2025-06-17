const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function buildKycPack({ idPath, proofPath, tokenMap = {}, entities = null }) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const outPath = path.join('downloads', `kyc_pack_${timestamp}.pdf`);

  const outPdf = await PDFDocument.create();
  const font = await outPdf.embedFont(StandardFonts.Helvetica);
  const page = outPdf.addPage([595, 842]); // A4 portrait

  // Write tokens to the cover page
  const tokens = Object.entries(tokenMap).map(([k, v]) => `${k}: ${v}`);
  const lines = ['KYC Cover Page', '', ...tokens];

  lines.forEach((line, i) => {
    page.drawText(line, {
      x: 50,
      y: 800 - i * 20,
      font,
      size: 12,
      color: rgb(0, 0, 0),
    });
  });

  // Load ID document PDF and copy pages
  const idPdf = await PDFDocument.load(fs.readFileSync(idPath));
  const idPages = await outPdf.copyPages(idPdf, idPdf.getPageIndices());
  idPages.forEach((p) => outPdf.addPage(p));

  // Load Proof of Address PDF and copy pages
  const proofPdf = await PDFDocument.load(fs.readFileSync(proofPath));
  const proofPages = await outPdf.copyPages(proofPdf, proofPdf.getPageIndices());
  proofPages.forEach((p) => outPdf.addPage(p));

  // Finalize and write
  const outBytes = await outPdf.save();
  fs.writeFileSync(outPath, outBytes);

  return { fileName: path.basename(outPath), outPath };
}

module.exports = { buildKycPack };
