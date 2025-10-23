import { PDFDocument, rgb, PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { auditTemplatePdf } from './auditTemplate';
import { ptSansFont } from './robotoFont';
import { categoryDetails, getCategoryDetail } from './categoryDescriptions';

interface CategoryScore {
  data: number;
  processes: number;
  people: number;
  results: number;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  wantsDeepAudit: boolean;
}

interface DiagnosticResults {
  totalScore: number;
  categoryScores: CategoryScore;
  interpretation: {
    emoji: string;
    title: string;
    description: string;
    recommendations: string[];
  };
  contactInfo: ContactInfo;
  auditNumber: number;
  completedAt: Date;
}

const COLORS = {
  textDark: [10, 10, 10] as [number, number, number],
  textLight: [255, 255, 255] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  amber: [234, 179, 8] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  header: [0, 0, 0] as [number, number, number],
};

const decodeBase64 = (base64: string): Uint8Array => {
  if (typeof window === 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  }
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const mmToPt = (mm: number) => (mm * 72) / 25.4;
const fromTop = (pageHeight: number, mm: number) => pageHeight - mmToPt(mm);
const rgbColor = (color: [number, number, number]) =>
  rgb(color[0] / 255, color[1] / 255, color[2] / 255);

const wrapLines = (text: string, maxWidth: number, font: PDFFont, size: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

export const generateDiagnosticPDF = async (results: DiagnosticResults) => {
  console.log('🚀 Начало генерации PDF (pdf-lib)...');

  const templateBytes = decodeBase64(auditTemplatePdf);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = decodeBase64(ptSansFont);
  const robotoFont = await pdfDoc.embedFont(fontBytes, { subset: true });

  const page = pdfDoc.getPages()[0];
  const pageHeight = page.getHeight();
  const pageWidth = page.getWidth();

  const auditNumberFormatted = results.auditNumber.toString().padStart(6, '0');
  const reportDate = results.completedAt ?? new Date();
  const formattedDate = reportDate.toLocaleDateString('ru-RU');

  const drawText = (
    text: string,
    xMm: number,
    yMm: number,
    size: number,
    options?: {
      color?: [number, number, number];
      font?: PDFFont;
      align?: 'left' | 'center' | 'right';
      maxWidthMm?: number;
      lineHeightMm?: number;
    },
  ) => {
    const {
      color = COLORS.textDark,
      font = robotoFont,
      align = 'left',
      maxWidthMm,
      lineHeightMm,
    } = options || {};

    const xPt = mmToPt(xMm);
    const baseYPt = fromTop(pageHeight, yMm);
    const sizePt = size;

    if (maxWidthMm) {
      const maxWidthPt = mmToPt(maxWidthMm);
      const lineHeightPt = lineHeightMm ? mmToPt(lineHeightMm) : sizePt * 1.2;
      const lines = wrapLines(text, maxWidthPt, font, sizePt);
      lines.forEach((line, index) => {
        const textWidth = font.widthOfTextAtSize(line, sizePt);
        let drawX = xPt;
        if (align === 'center') {
          drawX = xPt + (maxWidthPt - textWidth) / 2;
        } else if (align === 'right') {
          drawX = xPt + (maxWidthPt - textWidth);
        }
        const drawY = baseYPt - index * lineHeightPt;
        page.drawText(line, {
          x: drawX,
          y: drawY,
          size: sizePt,
          font,
          color: rgbColor(color),
        });
      });
      return;
    }

    const textWidth = font.widthOfTextAtSize(text, sizePt);
    let drawX = xPt;
    if (align === 'center') {
      drawX = xPt - textWidth / 2;
    } else if (align === 'right') {
      drawX = xPt - textWidth;
    }

    page.drawText(text, {
      x: drawX,
      y: baseYPt,
      size: sizePt,
      font,
      color: rgbColor(color),
    });
  };

  const drawMask = (
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
    color: [number, number, number],
  ) => {
    const widthPt = mmToPt(widthMm);
    const heightPt = mmToPt(heightMm);
    const xPt = mmToPt(xMm);
    const yPt = fromTop(pageHeight, yMm + heightMm);

    page.drawRectangle({
      x: xPt,
      y: yPt,
      width: widthPt,
      height: heightPt,
      color: rgbColor(color),
      borderWidth: 0,
    });
  };

  // Безопасные зоны: НЕ размещать контент
  // Сверху: 0-40mm (header с логотипом, "АУДИТ", QR-кодом)
  // Снизу: 260mm+ (footer с контактами, подписью)
  const SAFE_ZONE_TOP = 50; // начинаем контент с 50mm
  const SAFE_ZONE_BOTTOM = 255; // заканчиваем контент на 255mm

  // Заполняем данными из результатов диагностики - черным текстом на прозрачном фоне
  drawText(`№ ${auditNumberFormatted}`, 30, 45, 14, { color: COLORS.textDark });
  drawText(`${formattedDate}`, 135, 45, 11, { color: COLORS.textDark });

  const scoreColor =
    results.totalScore <= 8
      ? COLORS.red
      : results.totalScore <= 14
        ? COLORS.amber
        : COLORS.green;

  // Заголовок (начинаем с безопасной зоны)
  drawText('РЕЗУЛЬТАТЫ ДИАГНОСТИКИ', 30, SAFE_ZONE_TOP + 10, 18);

  drawText(`из 20 баллов`, 155, SAFE_ZONE_TOP + 10, 11, {
    color: COLORS.muted,
    align: 'right',
  });

  // Большая цифра результата
  drawText(results.totalScore.toString(), 105, SAFE_ZONE_TOP + 28, 48, {
    color: scoreColor,
    align: 'center',
  });

  // Блок статуса риска
  drawText(`${results.interpretation.emoji} ${results.interpretation.title}`, 30, SAFE_ZONE_TOP + 42, 16, {
    color: scoreColor,
  });

  drawText(results.interpretation.description, 30, SAFE_ZONE_TOP + 53, 10, {
    color: COLORS.muted,
    maxWidthMm: 150,
    lineHeightMm: 5,
  });

  // Рекомендации (не перекрываем нижний колонтитул)
  const recStartY = SAFE_ZONE_TOP + 80;
  drawText('Рекомендации:', 30, recStartY, 12);

  const recommendationStartY = recStartY + 10;
  const recommendationMaxWidth = 150;
  const recommendationLineHeight = 4.5;
  const firstPageLimit = SAFE_ZONE_BOTTOM;
  let currentY = recommendationStartY;
  const overflowRecommendations: { index: number; text: string }[] = [];

  results.interpretation.recommendations.forEach((rec, index) => {
    const numbered = `${index + 1}. ${rec}`;
    const lines = wrapLines(numbered, mmToPt(recommendationMaxWidth), robotoFont, 9);
    const blockHeight = lines.length * recommendationLineHeight + 2;

    if (currentY + blockHeight > firstPageLimit) {
      overflowRecommendations.push({ index: index + 1, text: rec });
      return;
    }

    lines.forEach((line, lineIndex) => {
      drawText(line, 35, currentY + lineIndex * recommendationLineHeight, 9, {
        color: COLORS.muted,
      });
    });
    currentY += blockHeight;
  });

  const hasOverflowRecommendations = overflowRecommendations.length > 0;

  // === СТРАНИЦА 2+: Детальный анализ категорий ===
  // Система многостраничного контента с автоматическим переносом
  const templateDoc = await PDFDocument.load(templateBytes);

  // Массив для хранения всех дополнительных страниц
  const pages: PDFPage[] = [];
  let currentPageIndex = 0;

  // Функция для создания новой страницы
  const addNewPage = async () => {
    const [newPage] = await pdfDoc.copyPages(templateDoc, [0]);
    const addedPage = pdfDoc.addPage(newPage);
    pages.push(addedPage);
    return addedPage;
  };

  // Создаем первую дополнительную страницу (страница 2)
  await addNewPage();

  // Универсальная функция рисования текста с автоматическим переносом на новую страницу
  const drawText2 = (
    text: string,
    xMm: number,
    yMm: number,
    size: number,
    options?: {
      color?: [number, number, number];
      font?: PDFFont;
      align?: 'left' | 'center' | 'right';
      maxWidthMm?: number;
      lineHeightMm?: number;
    },
  ) => {
    const {
      color = COLORS.textDark,
      font = robotoFont,
      align = 'left',
      maxWidthMm,
      lineHeightMm,
    } = options || {};

    const xPt = mmToPt(xMm);
    const baseYPt = fromTop(pageHeight, yMm);
    const sizePt = size;

    if (maxWidthMm) {
      const maxWidthPt = mmToPt(maxWidthMm);
      const lineHeightPt = lineHeightMm ? mmToPt(lineHeightMm) : sizePt * 1.2;
      const lines = wrapLines(text, maxWidthPt, font, sizePt);
      lines.forEach((line, index) => {
        const textWidth = font.widthOfTextAtSize(line, sizePt);
        let drawX = xPt;
        if (align === 'center') {
          drawX = xPt + (maxWidthPt - textWidth) / 2;
        } else if (align === 'right') {
          drawX = xPt + (maxWidthPt - textWidth);
        }
        const drawY = baseYPt - index * lineHeightPt;
        pages[currentPageIndex].drawText(line, {
          x: drawX,
          y: drawY,
          size: sizePt,
          font,
          color: rgbColor(color),
        });
      });
      return lines.length;
    }

    const textWidth = font.widthOfTextAtSize(text, sizePt);
    let drawX = xPt;
    if (align === 'center') {
      drawX = xPt - textWidth / 2;
    } else if (align === 'right') {
      drawX = xPt - textWidth;
    }

    pages[currentPageIndex].drawText(text, {
      x: drawX,
      y: baseYPt,
      size: sizePt,
      font,
      color: rgbColor(color),
    });
    return 1;
  };

  // Функция для проверки и создания новой страницы при необходимости
  const checkAndCreateNewPage = async (currentY: number, requiredSpace: number = 20) => {
    if (currentY + requiredSpace > SAFE_ZONE_BOTTOM) {
      await addNewPage();
      currentPageIndex++;
      return SAFE_ZONE_TOP + 10; // Возвращаем новую начальную позицию Y
    }
    return currentY;
  };

  // Заголовок второй страницы (начинаем с безопасной зоны)
  drawText2('ДЕТАЛЬНЫЙ АНАЛИЗ ПО КАТЕГОРИЯМ', 105, SAFE_ZONE_TOP, 16, { align: 'center' });
  drawText2(`Аудит № ${auditNumberFormatted}`, 105, SAFE_ZONE_TOP + 10, 10, { color: COLORS.muted, align: 'center' });

  let y2 = SAFE_ZONE_TOP + 20;

  if (hasOverflowRecommendations) {
    y2 = await checkAndCreateNewPage(y2, 15);
    drawText2('Рекомендации (продолжение):', 25, y2, 12);
    y2 += 8;

    for (const rec of overflowRecommendations) {
      y2 = await checkAndCreateNewPage(y2, 25);
      const numbered = `${rec.index}. ${rec.text}`;
      const linesUsed = drawText2(numbered, 30, y2, 9, {
        color: COLORS.muted,
        maxWidthMm: 150,
        lineHeightMm: 4,
      });
      y2 += linesUsed * 4 + 3;
    }

    y2 += 5;
  }

  const categorySummary = [
    { id: 'data', label: 'Данные', score: results.categoryScores.data },
    { id: 'processes', label: 'Процессы', score: results.categoryScores.processes },
    { id: 'people', label: 'Люди', score: results.categoryScores.people },
    { id: 'results', label: 'Результаты', score: results.categoryScores.results },
  ] as const;

  const sortedByScore = [...categorySummary].sort((a, b) => a.score - b.score);
  const weakest = sortedByScore[0];
  const strongest = sortedByScore[sortedByScore.length - 1];
  const averageScore =
    Math.round((categorySummary.reduce((acc, item) => acc + item.score, 0) / categorySummary.length) * 10) /
    10;

  // Средний балл и анализ
  y2 = await checkAndCreateNewPage(y2, 15);
  drawText2(`Средний балл по категориям: ${averageScore} / 5`, 25, y2, 10, {
    color: COLORS.muted,
  });
  y2 += 10;

  const weakestDetail = getCategoryDetail(weakest.id);
  const strongestDetail = getCategoryDetail(strongest.id);

  if (weakestDetail) {
    y2 = await checkAndCreateNewPage(y2, 20);
    const linesUsed = drawText2(
      `Основной риск: ${weakestDetail.emoji} ${weakestDetail.name} — ${weakest.score} / 5.`,
      30,
      y2,
      9,
      { color: COLORS.red, maxWidthMm: 160, lineHeightMm: 4 },
    );
    y2 += linesUsed * 4 + 4;
  }

  if (strongestDetail) {
    y2 = await checkAndCreateNewPage(y2, 20);
    const linesUsed = drawText2(
      `Сильная сторона: ${strongestDetail.emoji} ${strongestDetail.name} — ${strongest.score} / 5.`,
      30,
      y2,
      9,
      { color: COLORS.green, maxWidthMm: 160, lineHeightMm: 4 },
    );
    y2 += linesUsed * 4 + 6;
  }

  y2 = await checkAndCreateNewPage(y2, 20);
  drawText2('ДЕТАЛЬНЫЙ АНАЛИЗ ПО ОБЛАСТЯМ', 25, y2, 12);
  y2 += 8;

  // Проходим по каждой категории
  const categoryIds = ['data', 'processes', 'people', 'results'] as const;
  for (let index = 0; index < categoryIds.length; index++) {
    const catId = categoryIds[index];
    const detail = getCategoryDetail(catId);
    if (!detail) continue;

    const score = results.categoryScores[catId];
    const isWarning = (catId === 'data' || catId === 'results') ? score < 4 : score < 3;

    // Заголовок категории (проверяем место)
    y2 = await checkAndCreateNewPage(y2, 30);
    drawText2(`${detail.emoji} ${detail.name}`, 25, y2, 14);
    drawText2(`${score} / 5`, 180, y2, 12, { color: isWarning ? COLORS.red : COLORS.green, align: 'right' });
    y2 += 8;

    // Описание категории
    const descLines = drawText2(detail.fullDescription, 25, y2, 9, {
      color: COLORS.textDark,
      maxWidthMm: 160,
      lineHeightMm: 4,
    });
    y2 += descLines * 4 + 3;

    // Предупреждение если балл низкий
    if (isWarning) {
      y2 = await checkAndCreateNewPage(y2, 25);
      drawText2(`⚠️ ${detail.warningText}:`, 25, y2, 10, { color: COLORS.amber });
      y2 += 5;

      const warnLines = drawText2(detail.detailedWarning, 25, y2, 9, {
        color: COLORS.muted,
        maxWidthMm: 160,
        lineHeightMm: 4,
      });
      y2 += warnLines * 4 + 5;
    } else {
      y2 += 3;
    }

    // Разделитель между категориями (если не последняя)
    if (index < categoryIds.length - 1) {
      y2 = await checkAndCreateNewPage(y2, 5);
      pages[currentPageIndex].drawLine({
        start: { x: mmToPt(25), y: fromTop(pageHeight, y2) },
        end: { x: mmToPt(185), y: fromTop(pageHeight, y2) },
        thickness: 0.5,
        color: rgbColor(COLORS.muted),
      });
      y2 += 5;
    }
  }

  // Добавляем блок с призывом к действию (только если выбрали углубленную диагностику)
  if (results.contactInfo.wantsDeepAudit) {
    y2 = await checkAndCreateNewPage(y2 + 10, 20);
    drawText2('СЛЕДУЮЩИЕ ШАГИ', 25, y2, 14);
    y2 += 8;

    y2 = await checkAndCreateNewPage(y2, 25);
    drawText2('✅ Запрошена углубленная диагностика', 25, y2, 11, { color: COLORS.green });
    y2 += 5;
    const ctaLines = drawText2(
      'Наш эксперт свяжется с вами в течение 24 часов для согласования деталей бесплатного аудита 2-х процессов вашей компании с конкретным планом внедрения ИИ.',
      25,
      y2,
      9,
      { color: COLORS.muted, maxWidthMm: 160, lineHeightMm: 4 }
    );
    y2 += ctaLines * 4 + 10;
  }

  // Контактная информация клиента (перенесена с первой страницы)
  // Проверяем, есть ли место на текущей странице, иначе создаем новую
  y2 = await checkAndCreateNewPage(y2 + 10, 45);
  drawText2('Контактная информация:', 25, y2, 12);
  y2 += 8;
  drawText2(`${results.contactInfo.name}`, 30, y2, 10, { color: COLORS.muted });
  y2 += 8;
  drawText2(`${results.contactInfo.phone}`, 30, y2, 10, { color: COLORS.muted });
  y2 += 8;
  drawText2(`${results.contactInfo.email}`, 30, y2, 10, { color: COLORS.muted });

  if (results.contactInfo.wantsDeepAudit) {
    y2 += 8;
    drawText2('✓ Запрошен углубленный аудит', 30, y2, 10, { color: COLORS.green });
  } else {
    // Спецпредложение для тех, кто НЕ выбрал углубленную диагностику
    y2 = await checkAndCreateNewPage(y2 + 15, 80);

    // Рассчитываем дату окончания акции (сегодня + 10 дней)
    const promoEndDate = new Date();
    promoEndDate.setDate(promoEndDate.getDate() + 10);
    const promoEndDateFormatted = promoEndDate.toLocaleDateString('ru-RU');

    // Рамка для блока спецпредложения
    const boxX = 20;
    const boxY = y2 - 5;
    const boxWidth = 165;
    const boxHeight = 85; // Увеличена высота для размещения всего текста

    pages[currentPageIndex].drawRectangle({
      x: mmToPt(boxX),
      y: fromTop(pageHeight, boxY + boxHeight),
      width: mmToPt(boxWidth),
      height: mmToPt(boxHeight),
      borderColor: rgbColor(COLORS.amber),
      borderWidth: 2,
    });

    // Заголовок
    drawText2('💡 Хотите углубленную диагностику?', 25, y2, 12, { color: COLORS.amber });
    y2 += 10;

    // Описание
    const descLines = drawText2(
      'Мы предлагаем бесплатный аудит 2-х процессов вашей компании с конкретным планом внедрения ИИ.',
      25,
      y2,
      9,
      { color: COLORS.textDark, maxWidthMm: 155, lineHeightMm: 4 }
    );
    y2 += descLines * 4 + 5;

    drawText2('Вы можете обратиться к нам или в другую компанию с этой информацией.', 25, y2, 9, {
      color: COLORS.muted,
      maxWidthMm: 155,
      lineHeightMm: 4,
    });
    y2 += 8;

    // Спецпредложение
    drawText2('⏰ СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ', 25, y2, 11, { color: COLORS.amber });
    y2 += 7;

    drawText2('Углубленная диагностика 2-х процессов обычно стоит 1500 рублей.', 25, y2, 9, {
      color: COLORS.textDark,
      maxWidthMm: 155,
      lineHeightMm: 4,
    });
    y2 += 6;

    drawText2('Для вас — БЕСПЛАТНО!', 25, y2, 11, { color: COLORS.green });
    y2 += 8;

    drawText2(`Акция действует до: ${promoEndDateFormatted}`, 25, y2, 10, { color: COLORS.red });
    y2 += 10;

    // Призыв к действию
    drawText2('📞 Свяжитесь с нами по контактам ниже, чтобы воспользоваться', 25, y2, 9, {
      color: COLORS.muted,
      maxWidthMm: 155,
      lineHeightMm: 4,
    });
    y2 += 4;
    drawText2('бесплатной углубленной диагностикой.', 25, y2, 9, {
      color: COLORS.muted,
      maxWidthMm: 155,
      lineHeightMm: 4,
    });
  }

  // === НУМЕРАЦИЯ СТРАНИЦ ===
  // Добавляем номера страниц на все страницы (включая первую)
  const totalPages = pages.length + 1; // +1 для первой страницы

  // Нумерация первой страницы
  const pageNumberY = 283; // Самый низ страницы, но чуть выше footer
  page.drawText(`1 из ${totalPages}`, {
    x: mmToPt(105) - robotoFont.widthOfTextAtSize(`1 из ${totalPages}`, 9) / 2,
    y: fromTop(pageHeight, pageNumberY),
    size: 9,
    font: robotoFont,
    color: rgbColor(COLORS.muted),
  });

  // Нумерация остальных страниц
  pages.forEach((p, index) => {
    const pageNum = index + 2; // +2 потому что первая страница уже есть
    const pageText = `${pageNum} из ${totalPages}`;
    p.drawText(pageText, {
      x: mmToPt(105) - robotoFont.widthOfTextAtSize(pageText, 9) / 2,
      y: fromTop(pageHeight, pageNumberY),
      size: 9,
      font: robotoFont,
      color: rgbColor(COLORS.muted),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const fileName = `Diagnostika_AI_${results.contactInfo.name.replace(/\s+/g, '_')}_${new Date()
    .toISOString()
    .split('T')[0]}.pdf`;

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
  console.log('✅ PDF успешно сгенерирован (pdf-lib)');
};
