const fs = require('fs');
const path = require('path');

const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.js');
const destPath = path.join(__dirname, 'public', 'pdf.worker.min.js');

// Ensure public directory exists
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Copy worker file
fs.copyFileSync(workerPath, destPath);
console.log('PDF.js worker copied to public directory');
