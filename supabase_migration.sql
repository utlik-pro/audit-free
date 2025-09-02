-- ====================================================
-- Миграция для добавления функциональности архивирования
-- в таблицу quiz_responses
-- ====================================================

-- Шаг 1: Добавляем колонку archived
-- Эта колонка будет хранить статус архивирования записи
ALTER TABLE quiz_responses
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Шаг 2: Создаем индекс для оптимизации запросов
-- Это ускорит фильтрацию по архивным/активным записям
CREATE INDEX IF NOT EXISTS idx_quiz_responses_archived 
ON quiz_responses(archived);

-- Шаг 3: Создаем индекс для сортировки по дате
-- Если еще не существует
CREATE INDEX IF NOT EXISTS idx_quiz_responses_completed_at 
ON quiz_responses(completed_at DESC);

-- Шаг 4: Обновляем RLS политики (если используются)
-- Раскомментируйте если у вас включен RLS
/*
-- Политика для чтения всех записей (включая архивные)
CREATE POLICY "Enable read access for all quiz_responses" 
ON quiz_responses FOR SELECT 
USING (true);

-- Политика для обновления архивного статуса
CREATE POLICY "Enable archive update for quiz_responses" 
ON quiz_responses FOR UPDATE 
USING (true)
WITH CHECK (true);
*/

-- Шаг 5: Проверка миграции
-- Этот запрос покажет структуру таблицы после миграции
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'quiz_responses'
ORDER BY 
    ordinal_position;

-- Шаг 6: Тестовый запрос
-- Проверяем, что можем фильтровать по архивному статусу
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN archived = true THEN 1 END) as archived_count,
    COUNT(CASE WHEN archived = false THEN 1 END) as active_count
FROM 
    quiz_responses;

-- ====================================================
-- ВАЖНО: Если у вас есть архивные записи в localStorage,
-- выполните следующие шаги:
-- 
-- 1. Откройте админ-панель в браузере
-- 2. Откройте консоль разработчика (F12)
-- 3. Выполните команду:
--    JSON.parse(localStorage.getItem('archivedResponses') || '[]')
-- 4. Скопируйте полученные ID
-- 5. Выполните запрос ниже, подставив ID:
-- ====================================================

-- Пример обновления существующих архивных записей
-- Замените 'id1', 'id2', 'id3' на реальные ID из localStorage
/*
UPDATE quiz_responses 
SET archived = true 
WHERE id IN ('id1', 'id2', 'id3');
*/

-- После успешной миграции можно очистить localStorage
-- выполнив в консоли браузера:
-- localStorage.removeItem('archivedResponses');