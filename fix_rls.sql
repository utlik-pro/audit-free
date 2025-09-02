-- ====================================================
-- Исправление проблем с архивированием и удалением
-- ====================================================

-- Вариант 1: Отключить RLS (быстрое решение)
ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;

-- Вариант 2: Настроить RLS с правильными политиками
-- Раскомментируйте строки ниже, если хотите использовать RLS

/*
-- Включить RLS
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Удалить старые политики если есть
DROP POLICY IF EXISTS "Enable all operations for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable read for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable insert for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable update for quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Enable delete for quiz_responses" ON quiz_responses;

-- Создать универсальную политику для всех операций
CREATE POLICY "Enable all operations for quiz_responses" 
ON quiz_responses 
FOR ALL 
USING (true) 
WITH CHECK (true);
*/

-- Проверка результата
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    tablename = 'quiz_responses';