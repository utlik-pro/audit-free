// Скрипт для генерации base64 шрифта
// Запустите: node src/utils/generateFont.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const FONT_URL = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff';
const OUTPUT_FILE = path.join(__dirname, 'robotoBase64.ts');

console.log('Скачивание шрифта Roboto...');

https.get(FONT_URL, (response) => {
  const chunks = [];

  response.on('data', (chunk) => {
    chunks.push(chunk);
  });

  response.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString('base64');

    const output = `// Auto-generated Roboto font in base64 format
// Supports Cyrillic characters
export const robotoBase64 = '${base64}';
`;

    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`✅ Шрифт успешно сохранён в ${OUTPUT_FILE}`);
    console.log(`Размер: ${(base64.length / 1024).toFixed(2)} KB`);
  });
}).on('error', (err) => {
  console.error('❌ Ошибка при скачивании шрифта:', err.message);
  process.exit(1);
});
