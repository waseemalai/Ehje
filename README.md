# PDF Tools Backend

Express backend covering the PDF tool categories: Organize, Edit, Optimize & Repair,
Security & Privacy, Convert (to/from PDF, images), and OCR.

## Local run

```bash
npm install
npm run dev
```

Needs these system tools installed locally (already handled by Dockerfile for Railway):
`ghostscript`, `qpdf`, `libreoffice`, `poppler-utils`, `tesseract-ocr`, `img2pdf`.

## Deploy to Railway

1. Push this folder to a GitHub repo.
2. On Railway: New Project -> Deploy from GitHub repo.
3. Railway auto-detects the `Dockerfile` and builds it (installs Ghostscript,
   LibreOffice, qpdf, Tesseract inside the container - no manual setup needed).
4. Set `PORT` env var if Railway doesn't inject one automatically (it usually does).
5. Note: LibreOffice + Ghostscript image is heavy (~1-1.5GB). Use Railway's paid
   tier if the free tier's build/memory limits are too tight for office conversions.

## API Routes

### Organize — `/api/organize`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/merge` | POST | `files[]` (multipart) | merge multiple PDFs |
| `/split` | POST | `file`, `ranges` (e.g. `1-3,4-5`) | returns zip |
| `/rotate` | POST | `file`, `degrees`, `pages` | pages: "all" or "1,3" |
| `/extract` | POST | `file`, `pages` (e.g. `1,3,5-7`) | keeps only these |
| `/remove` | POST | `file`, `pages` | removes these, keeps rest |
| `/rearrange` | POST | `file`, `order` (e.g. `3,1,2`) | new page order |

Covers: Merge, Split, Rearrange, Remove, Extract, Rotate PDF. (Pages-per-sheet,
Halve pages, Bookmark PDF follow the same pdf-lib pattern — add as needed.)

### Edit — `/api/edit`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/watermark` | POST | `file`, `text`, `opacity`, `fontSize` | diagonal text stamp |
| `/page-numbers` | POST | `file`, `position`, `startAt` | |
| `/crop` | POST | `file`, `top/bottom/left/right` | points |
| `/page-size` | POST | `file`, `width`, `height` | e.g. A4 = 595,842 |
| `/overlay` | POST | `base`, `overlay` (2 files) | PDF Overlay tool |

Covers: Add watermark, Add page numbers, Crop PDF, Change page size, PDF Overlay.
(Edit PDF text/Annotate/Fill forms/Fillable forms need a PDF.js-based frontend
editor — backend just saves the edited bytes the frontend sends.)

### Optimize & Repair — `/api/optimize`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/compress` | POST | `file`, `level` (`screen`/`ebook`/`printer`) | Ghostscript |
| `/repair` | POST | `file` | qpdf, falls back to Ghostscript |
| `/pdf-to-pdfa` | POST | `file` | Ghostscript |
| `/flatten` | POST | `file` | flattens form fields |
| `/rasterize` | POST | `file` | renders pages to images, rebuilds PDF |

### Security & Privacy — `/api/security`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/protect` | POST | `file`, `password` | AES-256 via qpdf |
| `/unlock` | POST | `file`, `password` | |
| `/remove-metadata` | POST | `file` | |
| `/generate-password` | GET | `?length=16` | |

Sign PDF and Redact PDF are flagged in the code but not implemented yet — both
need care (Redact must actually delete content, not just draw over it; Sign
needs a signature-drawing UI + optional cryptographic signing).

### Convert — `/api/convert`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/office-to-pdf` | POST | `file` | Word/Excel/PPT/Publisher/ODT/ODS/ODP/RTF/TXT/EPUB → PDF via LibreOffice |
| `/pdf-to-office` | POST | `file`, `format` | PDF → docx/xlsx/pptx/odt/txt/rtf/html |
| `/images-to-pdf` | POST | `files[]` | JPG/PNG/WEBP/HEIC → one PDF |
| `/pdf-to-images` | POST | `file`, `format`, `dpi` | returns zip |
| `/html-to-pdf` | POST | `file` or `url` | webpage → PDF |
| `/image-format` | POST | `file`, `to` | JPG/PNG/WEBP/HEIC conversions |

This one set of LibreOffice routes covers ALL the "Convert to/from PDF" boxes
in your screenshot (Word, Excel, PowerPoint, Publisher, ODT, ODS, ODP, TXT, RTF,
EPUB, Markdown) — just change the `format` value.

### OCR — `/api/ocr`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/pdf` | POST | `file` | returns a searchable PDF (Tesseract) |
| `/text` | POST | `file` | returns plain extracted text |

### Misc — `/api/misc`
| Route | Method | Body | Notes |
|---|---|---|---|
| `/create-pdf` | POST | `{ text }` (JSON) | Create PDF tool |
| `/info` | POST | `file` | page count/metadata — View as PDF |
| `/compare` | POST | `fileA`, `fileB` | extracts text from both for diffing |

## Not yet built (same patterns apply, add when needed)
- Fillable PDF forms / Fill out PDF / Create PDF job application / Create invoice
  — these are form-builder UIs; backend endpoint just needs to accept field
  values + a template and stamp them onto the PDF with pdf-lib, same as `/edit`.
- Sign PDF, Redact PDF — see note in `security.js`.
- Generate QR code — trivial to add with the `qrcode` npm package.
- HEIC input handling for `sharp` may need `heic-convert` on some platforms —
  test on Railway's build since `sharp`'s bundled libvips usually handles it.

## Cleanup / privacy
Uploaded and generated files are deleted immediately after each response is
sent, and a cron job also wipes anything older than 1 hour in `src/uploads`
and `src/output` as a safety net.
