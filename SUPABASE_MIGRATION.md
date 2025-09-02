# Инструкция по добавлению колонки archived в Supabase

## Способ 1: Через Supabase Dashboard (Рекомендуется)

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на [https://app.supabase.com](https://app.supabase.com)
2. Войдите в свой аккаунт
3. Выберите ваш проект

### Шаг 2: Добавьте колонку через Table Editor
1. В левом меню выберите **Table Editor**
2. Найдите и откройте таблицу `quiz_responses`
3. Нажмите кнопку **+ New Column**
4. Заполните поля:
   - **Name**: `archived`
   - **Type**: `bool`
   - **Default Value**: `false`
   - **Is Nullable**: снимите галочку (unchecked)
5. Нажмите **Save**

### Шаг 3: Создайте индекс для оптимизации (опционально)
1. Перейдите в **SQL Editor**
2. Выполните следующий запрос:
```sql
CREATE INDEX idx_quiz_responses_archived ON quiz_responses(archived);
```

## Способ 2: Через SQL Editor

### Шаг 1: Откройте SQL Editor
1. В Supabase Dashboard перейдите в **SQL Editor**
2. Нажмите **+ New Query**

### Шаг 2: Выполните миграцию
Скопируйте и выполните следующий SQL запрос:

```sql
-- Добавляем колонку archived в таблицу quiz_responses
ALTER TABLE quiz_responses
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Создаем индекс для быстрой фильтрации по архивным записям
CREATE INDEX IF NOT EXISTS idx_quiz_responses_archived 
ON quiz_responses(archived);

-- Опционально: обновляем существующие записи (все будут неархивными)
UPDATE quiz_responses 
SET archived = FALSE 
WHERE archived IS NULL;
```

### Шаг 3: Проверьте результат
После выполнения запроса:
1. Перейдите в **Table Editor**
2. Откройте таблицу `quiz_responses`
3. Убедитесь, что колонка `archived` появилась

## Способ 3: Через Supabase CLI

### Предварительные требования
Установите Supabase CLI:
```bash
npm install -g supabase
```

### Шаг 1: Создайте файл миграции
```bash
supabase migration new add_archived_column
```

### Шаг 2: Добавьте SQL в файл миграции
Откройте созданный файл в папке `supabase/migrations/` и добавьте:

```sql
-- Add archived column to quiz_responses table
ALTER TABLE quiz_responses
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_archived 
ON quiz_responses(archived);
```

### Шаг 3: Примените миграцию
```bash
supabase db push
```

## Проверка интеграции

После добавления колонки:

1. **Проверьте в админке:**
   - Откройте админ-панель вашего приложения
   - Попробуйте архивировать запись
   - Обновите страницу - запись должна остаться в архиве
   - Больше не должно появляться предупреждение о локальном хранении

2. **Проверьте в Supabase:**
   - В Table Editor откройте таблицу `quiz_responses`
   - Архивированные записи должны иметь `archived = true`
   - Активные записи должны иметь `archived = false`

## Миграция существующих архивных данных из localStorage

Если у вас уже есть архивные записи в localStorage, выполните этот скрипт в консоли браузера на странице админки:

```javascript
// Получаем архивные ID из localStorage
const archivedIds = JSON.parse(localStorage.getItem('archivedResponses') || '[]');

// Если есть архивные записи
if (archivedIds.length > 0) {
  console.log(`Найдено ${archivedIds.length} архивных записей в localStorage`);
  console.log('IDs:', archivedIds);
  
  // После применения миграции в Supabase, выполните этот SQL запрос
  // в SQL Editor для обновления архивных записей:
  console.log('Выполните этот запрос в Supabase SQL Editor:');
  console.log(`
UPDATE quiz_responses 
SET archived = true 
WHERE id IN (${archivedIds.map(id => `'${id}'`).join(', ')});
  `);
  
  // После успешного обновления в БД, очистите localStorage:
  // localStorage.removeItem('archivedResponses');
}
```

## Преимущества после интеграции

1. ✅ **Надежность**: Архивные данные хранятся в базе данных
2. ✅ **Синхронизация**: Архив доступен с любого устройства
3. ✅ **Производительность**: Индекс ускоряет фильтрацию архивных записей
4. ✅ **Консистентность**: Нет расхождений между localStorage и БД

## Возможные проблемы и решения

### Проблема: Ошибка прав доступа
**Решение**: Убедитесь, что у вас есть права на изменение схемы таблицы в Supabase.

### Проблема: Колонка уже существует
**Решение**: Запрос использует `IF NOT EXISTS`, поэтому безопасно выполнять повторно.

### Проблема: Архивирование все еще работает через localStorage
**Решение**: 
1. Очистите кэш браузера
2. Проверьте, что миграция применена успешно
3. Убедитесь, что колонка `archived` видна в Table Editor

## Контакты поддержки

Если возникли проблемы с миграцией:
- Документация Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Поддержка Supabase: [https://supabase.com/support](https://supabase.com/support)