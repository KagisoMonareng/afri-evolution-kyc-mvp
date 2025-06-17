// agents/ocrAgent.js  — v2.3  (hybrid OCR with GraphicsMagick fallback)
const fs             = require('fs');
const path           = require('path');
const pdfParse       = require('pdf-parse');          // fast text path
const { fromPath }   = require('pdf2pic');            // rasteriser
const sharp          = require('sharp');              // image optimise
const nlp            = require('compromise');         // entity extraction
const { createWorker } = require('tesseract.js');     // OCR engine

// (dates plug-in goes here)
const nlpDates      = require('compromise-dates');   // NEW ▶ adds `.dates()`
nlp.extend(nlpDates);                                // NEW ▶ install plug-in


/* ───────────── single-image OCR helper ───────────── */
async function ocrImage(buffer) {
  const worker = await createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const {
    data: { text }
  } = await worker.recognize(buffer);

  await worker.terminate();
  return text;
}

/* ───────────── hybrid extractor (parse → OCR) ─────── */
async function extractTextHybrid(pdfPath) {
  const data = fs.readFileSync(pdfPath);
  let text   = '';

  /* fast path — PDF already contains text */
  try {
    ({ text } = await pdfParse(data));
  } catch (_) {
    text = '';
  }
  if (text && text.trim().length > 40) return text;

  /* fallback — rasterise pages then OCR */
  const imagesDir = path.join(__dirname, '..', 'tmp_ocr');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

  const convert = fromPath(pdfPath, {
    density : 200,
    format  : 'png',
    savePath: imagesDir,
    width   : 1600,
    height  : 2000
  });

  // -1  → convert all pages; no 2nd arg (the bug fix!)
  const pages  = await convert.bulk(-1);
  let fullText = '';

  for (const page of pages) {
    const rawPng     = fs.readFileSync(page.path);
    const optimised  = await sharp(rawPng).resize(1600).toBuffer();
    fullText        += await ocrImage(optimised) + '\n';
    fs.unlinkSync(page.path);                         // clean tmp file
  }
  return fullText;
}

/* ───────────── simple entity extraction ───────────── */
function extractEntities(raw) {
  const doc       = nlp(raw);

  const names     = doc.people().out('array');
  const dates     = doc.dates().out('array');
  const idNumbers = raw.match(/\b\d{13,}\b/g) || [];      // SA 13-digit IDs

  // naive street-address heuristic
  const addrMatch = raw.match(
    /([^\n]+\b(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr)\b[^\n]+)/i
  );

  return {
    names,
    dates,
    id_numbers : idNumbers,
    address    : addrMatch ? addrMatch[1].trim() : null
  };
}

module.exports = { extractTextHybrid, extractEntities };
