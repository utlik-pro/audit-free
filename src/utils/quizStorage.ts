/**
 * Утилиты для сохранения и восстановления прогресса квиза в localStorage
 */

interface QuizProgress {
  currentQuestionIndex: number;
  responses: Array<{
    questionId: number;
    rating: number;
    category: string;
  }>;
  selectedRating: number | null;
  timestamp: number;
}

const STORAGE_KEY = 'audit_free_quiz_progress';
const STORAGE_EXPIRY_DAYS = 7; // Прогресс хранится 7 дней

/**
 * Сохранить прогресс квиза в localStorage
 */
export const saveQuizProgress = (progress: Omit<QuizProgress, 'timestamp'>) => {
  try {
    const data: QuizProgress = {
      ...progress,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving quiz progress:', error);
  }
};

/**
 * Загрузить прогресс квиза из localStorage
 * Возвращает null если прогресс не найден или устарел
 */
export const loadQuizProgress = (): QuizProgress | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: QuizProgress = JSON.parse(stored);

    // Проверяем срок действия
    const expiryTime = STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > expiryTime) {
      clearQuizProgress();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error loading quiz progress:', error);
    return null;
  }
};

/**
 * Очистить сохраненный прогресс
 */
export const clearQuizProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing quiz progress:', error);
  }
};

/**
 * Проверить, есть ли сохраненный прогресс
 */
export const hasQuizProgress = (): boolean => {
  return loadQuizProgress() !== null;
};
