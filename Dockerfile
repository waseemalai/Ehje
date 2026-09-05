FROM node:18-slim

# System tools needed by different PDF operations:
# - ghostscript: compress/optimize/PDF-A conversion
# - qpdf: protect/unlock/repair
# - libreoffice: office <-> PDF conversion (Word, Excel, PPT, ODT, etc.)
# - poppler-utils: pdftoppm (PDF->image), pdftotext, pdfinfo
# - tesseract-ocr: OCR
# - img2pdf: image -> PDF (backup path, sharp+pdf-lib handles most)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    qpdf \
    libreoffice \
    poppler-utils \
    tesseract-ocr \
    img2pdf \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p src/uploads src/output

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
