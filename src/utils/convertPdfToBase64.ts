import * as fs from 'fs';
import * as path from 'path';

// Утилита для конвертации PDF файла в base64 строку для использования в шаблоне
// Использование: node --loader ts-node/esm src/utils/convertPdfToBase64.ts

const pdfPath = path.join(process.cwd(), 'Audit_v1.1.pdf');
const outputPath = path.join(process.cwd(), 'src/utils/auditTemplate.ts');

try {
  // Читаем PDF файл
  const pdfBuffer = fs.readFileSync(pdfPath);

  // Конвертируем в base64
  const base64String = pdfBuffer.toString('base64');

  // Разбиваем на строки по 100 символов для читаемости
  const chunks: string[] = [];
  for (let i = 0; i < base64String.length; i += 100) {
    chunks.push(base64String.slice(i, i + 100));
  }

  // Создаем TypeScript файл с экспортом
  const tsContent = `// Auto-generated PDF template (base64-encoded)
// Source: Audit_v1.1.pdf
export const auditTemplatePdf =
  '${chunks.join("' +\n  '")}';
`;

  // Записываем результат
  fs.writeFileSync(outputPath, tsContent, 'utf-8');

  console.log('✅ PDF успешно сконвертирован в base64');
  console.log(`📄 Исходный файл: ${pdfPath}`);
  console.log(`📝 Результат: ${outputPath}`);
  console.log(`📊 Размер: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`📏 Base64 длина: ${base64String.length} символов`);
} catch (error) {
  console.error('❌ Ошибка при конвертации:', error);
  process.exit(1);
}
