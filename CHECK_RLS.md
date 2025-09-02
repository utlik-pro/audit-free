# Проверка и настройка RLS в Supabase

## Проблема
Архивирование и удаление не работают. Возможные причины:
1. RLS (Row Level Security) блокирует операции UPDATE и DELETE
2. Недостаточно прав для анонимного пользователя

## Шаг 1: Проверка RLS

1. Откройте Supabase Dashboard
2. Перейдите в **Authentication** → **Policies**
3. Найдите таблицу `quiz_responses`
4. Проверьте, включен ли RLS

## Шаг 2: Если RLS включен, добавьте политики

### Вариант A: Отключить RLS (быстрое решение для тестирования)

В SQL Editor выполните:
```sql
-- Отключить RLS для таблицы
ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;
```

### Вариант B: Настроить политики RLS (рекомендуется для продакшена)

В SQL Editor выполните:
```sql
-- Включить RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Удалить существующие политики (если есть)
DROP POLICY IF EXISTS "Enable all operations for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable read for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable insert for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable update for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable delete for quiz_responses" ON quiz_responses;

-- Создать политику для всех операций (для анонимных пользователей)
CREATE POLICY "Enable all operations for quiz_responses" 
ON quiz_responses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ИЛИ создать отдельные политики для каждой операции:
/*
-- Чтение
CREATE POLICY "Enable read for quiz_responses" 
ON quiz_responses FOR SELECT 
USING (true);

-- Вставка
CREATE POLICY "Enable insert for quiz_responses" 
ON quiz_responses FOR INSERT 
WITH CHECK (true);

-- Обновление
CREATE POLICY "Enable update for quiz_responses" 
ON quiz_responses FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Удаление
CREATE POLICY "Enable delete for quiz_responses" 
ON quiz_responses FOR DELETE 
USING (true);
*/
```

## Шаг 3: Проверка прав доступа к колонкам

Убедитесь, что колонка `archived` доступна для обновления:
```sql
-- Проверить структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    is_updatable
FROM 
    information_schema.columns
WHERE 
    table_name = 'quiz_responses'
    AND column_name = 'archived';
```

## Шаг 4: Тестирование в SQL Editor

Попробуйте выполнить операции напрямую:
```sql
-- Тест архивирования
UPDATE quiz_responses 
SET archived = true 
WHERE id = 'введите-id-записи-здесь'
RETURNING *;

-- Тест удаления
DELETE FROM quiz_responses 
WHERE id = 'введите-id-записи-здесь'
RETURNING *;
```

## Шаг 5: Проверка в консоли браузера

1. Откройте админ-панель
2. Откройте консоль разработчика (F12)
3. Попробуйте архивировать или удалить запись
4. Посмотрите на логи в консоли

Ищите сообщения типа:
- "Архивирование:" 
- "Результат обновления:"
- "Удаление записи:"
- "Результат удаления:"

## Возможные ошибки и решения

### Ошибка: "new row violates row-level security policy"
**Решение**: Настройте политики RLS (см. Шаг 2)

### Ошибка: "permission denied for table quiz_responses"
**Решение**: Проверьте права доступа в Database → Roles

### Ошибка: "column archived does not exist"
**Решение**: Примените миграцию из файла `supabase_migration.sql`

## Дополнительная отладка

Если проблема не решена, выполните в SQL Editor:
```sql
-- Проверить все политики для таблицы
SELECT * FROM pg_policies WHERE tablename = 'quiz_responses';

-- Проверить права текущего пользователя
SELECT current_user, session_user;

-- Проверить права на таблицу
SELECT 
    grantee, 
    privilege_type 
FROM 
    information_schema.table_privileges 
WHERE 
    table_name = 'quiz_responses';
```

## Контакты поддержки
- Документация Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Поддержка: https://supabase.com/support