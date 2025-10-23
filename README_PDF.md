# Система генерации PDF-отчетов

## Обзор

Приложение использует шаблон PDF `Audit_v1.1.pdf` для генерации персонализированных отчетов по результатам диагностики бизнес-процессов.

## Структура файлов

```
src/utils/
├── pdfGenerator.ts          # Основной генератор PDF
├── auditTemplate.ts         # Base64-кодированный шаблон PDF
├── convertPdfToBase64.ts    # Утилита для обновления шаблона
├── robotoFont.ts            # Шрифт PT Sans для кириллицы
└── fontLoader.ts            # Загрузчик шрифтов
```

## Как работает генерация PDF

### 1. Шаблон PDF
- Исходный файл: `Audit_v1.1.pdf` (в корне проекта)
- Конвертирован в base64 и сохранен в `auditTemplate.ts`
- Содержит статический дизайн: логотип, структуру, QR-код

### 2. Процесс генерации

```typescript
import { generateDiagnosticPDF } from '@/utils/pdfGenerator';

await generateDiagnosticPDF({
  totalScore: 15,
  categoryScores: {
    data: 4,
    processes: 3,
    people: 4,
    results: 4,
  },
  interpretation: {
    emoji: '🟢',
    title: 'Зона готовности',
    description: 'Ваша компания готова к системному внедрению ИИ',
    recommendations: [...]
  },
  contactInfo: {
    name: 'Иван Иванов',
    phone: '+7 999 123-45-67',
    email: 'ivan@example.com',
    wantsDeepAudit: true
  },
  auditNumber: 42,
  completedAt: new Date()
});
```

### 3. Технологии

- **pdf-lib** - модификация существующих PDF
- **@pdf-lib/fontkit** - поддержка кириллических шрифтов
- **PT Sans** - шрифт с поддержкой кириллицы

## Обновление шаблона PDF

Если нужно изменить дизайн шаблона:

### Шаг 1: Создайте новый PDF в Canva/Figma
- Размер: A4 (210x297 мм)
- Сохраните как `Audit_v1.1.pdf` в корне проекта

### Шаг 2: Конвертируйте в base64
```bash
npx tsx src/utils/convertPdfToBase64.ts
```

Это автоматически обновит `src/utils/auditTemplate.ts`

### Шаг 3: Настройте координаты в pdfGenerator.ts

Координаты указываются в миллиметрах (от верхнего левого угла):

```typescript
// Маскируем статические элементы белым цветом
drawMask(x_mm, y_mm, width_mm, height_mm, COLORS.white);

// Добавляем текст
drawText('Текст', x_mm, y_mm, fontSize, {
  color: COLORS.textDark,
  align: 'left' | 'center' | 'right',
  maxWidthMm: 150,  // для переноса строк
});
```

### Шаг 4: Протестируйте
- Запустите приложение: `npm run dev`
- Пройдите диагностику до конца
- Скачайте PDF и проверьте расположение элементов

## Настройка позиционирования

### Текущие координаты (Audit_v1.1.pdf):

```typescript
// Шапка
Номер аудита:  x=30mm,  y=45mm
Дата:          x=135mm, y=45mm

// Основной контент
Заголовок:     x=105mm, y=85mm  (центр)
Общий балл:    x=105mm, y=105mm (центр, 48pt)
Интерпретация: x=105mm, y=135mm (центр)

// Категории
Начало:        x=35mm,  y=188mm
Интервал:      12mm между строками

// Контакты
Заголовок:     x=30mm,  y=238mm
Данные:        x=35mm,  y=248mm (с интервалом 8mm)

// Рекомендации
Заголовок:     x=30mm,  y=286mm
Текст:         x=35mm,  y=296mm
```

## Цветовая схема

```typescript
const COLORS = {
  textDark: [10, 10, 10],         // Основной текст
  textLight: [255, 255, 255],     // Текст на темном фоне
  muted: [120, 120, 120],         // Вторичный текст
  green: [34, 197, 94],           // Успех
  amber: [234, 179, 8],           // Предупреждение
  red: [239, 68, 68],             // Ошибка
  white: [255, 255, 255],         // Маска
  header: [0, 0, 0],              // Черный фон шапки
};
```

## Отладка

### Проблема: Текст не виден
- Проверьте, что маска (`drawMask`) покрывает статический текст шаблона
- Убедитесь, что цвет маски соответствует фону (`COLORS.white` для белого фона)

### Проблема: Неправильное позиционирование
- Используйте миллиметры, не пиксели
- Функция `fromTop()` конвертирует координаты от верха страницы
- Высота страницы A4: 297mm

### Проблема: Кириллица не отображается
- Проверьте, что `robotoFont` правильно загружен
- Убедитесь, что используется `font: robotoFont` в опциях

## Примеры использования

### Базовая генерация
```typescript
const results = calculateResults();
await generateDiagnosticPDF({
  ...results,
  contactInfo,
  auditNumber,
  completedAt: new Date()
});
```

### С пользовательскими настройками
```typescript
// В будущем можно добавить опции
await generateDiagnosticPDF(results, {
  filename: 'custom-name.pdf',
  includeQRCode: true,
  language: 'ru'
});
```

## Лицензия и авторство

- Шаблон разработан в Canva
- Шрифт: PT Sans (Open Font License)
- Логотип и брендинг: Utlik.co
