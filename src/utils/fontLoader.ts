import { jsPDF } from 'jspdf';
import { ptSansFont } from './robotoFont';

// Добавляем TTF со встроенной поддержкой кириллицы в виртуальную ФС jsPDF
export const addCyrillicFont = (doc: jsPDF): boolean => {
  try {
    const fontData = ptSansFont.replace(/\s+/g, '');
    doc.addFileToVFS('Roboto-Regular.ttf', fontData);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    console.log('✅ Кириллический шрифт успешно загружен');
    return true;
  } catch (error) {
    console.error('❌ Ошибка при добавлении кириллического шрифта:', error);
    return false;
  }
};
