require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { scheduleCleanup } = require('./utils/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

// ensure upload/output dirs exist
['uploads', 'output'].forEach((d) => {
  const p = path.join(__dirname, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors());
app.use(express.json());

// Routes, grouped exactly like the tool categories in the app:
app.use('/api/organize', require('./routes/organize'));   // merge, split, rotate, extract, remove, rearrange
app.use('/api/edit', require('./routes/edit'));            // watermark, page numbers, crop, page size, overlay
app.use('/api/optimize', require('./routes/optimize'));    // compress, repair, PDF/A, flatten, rasterize
app.use('/api/security', require('./routes/security'));    // protect, unlock, remove metadata, generate password
app.use('/api/convert', require('./routes/convert'));      // office<->pdf, images<->pdf, html to pdf
app.use('/api/ocr', require('./routes/ocr'));              // OCR / searchable PDF
app.use('/api/misc', require('./routes/misc'));            // create PDF, info/view, compare

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// auto-delete temp files older than 1 hour, every hour (privacy + disk space)
scheduleCleanup(cron, [path.join(__dirname, 'uploads'), path.join(__dirname, 'output')]);

// centralized error handler (e.g. multer file-too-large errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

app.listen(PORT, () => console.log(`PDF tools backend running on port ${PORT}`));
