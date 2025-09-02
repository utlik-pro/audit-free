# Инструкция по применению миграции для архивирования

## Шаги для добавления функции архивирования в Supabase:

### Вариант 1: Через SQL Editor в Supabase Dashboard

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor** (слева в меню)
4. Создайте новый запрос
5. Вставьте следующий SQL код:

```sql
-- Add archived column to quiz_responses table
ALTER TABLE quiz_responses
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_archived ON quiz_responses(archived);
```

6. Нажмите **Run** для выполнения миграции

### Вариант 2: Через Supabase CLI

1. Установите Supabase CLI если еще не установлен:
```bash
npm install -g supabase
```

2. Подключитесь к проекту:
```bash
supabase link --project-ref gfuywdvvjsmbqtawpope
```

3. Примените миграцию:
```bash
supabase db push
```

## Проверка

После применения миграции:
1. Перейдите в **Table Editor** в Supabase Dashboard
2. Откройте таблицу `quiz_responses`
3. Убедитесь, что появилась колонка `archived` типа `boolean`

## Временное решение

Пока миграция не применена, приложение будет использовать localStorage для хранения информации об архивированных записях. После применения миграции данные будут автоматически синхронизироваться с базой данных.

## Важно

После применения миграции архивирование будет работать полноценно:
- Данные будут сохраняться в базе данных
- Архивные записи будут доступны при перезагрузке страницы
- Архивирование будет работать для всех пользователей админ-панели