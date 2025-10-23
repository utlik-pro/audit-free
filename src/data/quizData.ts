export interface Question {
  id: number;
  text: string;
  category: string;
  explanation?: string;
  examples?: string[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  warningThreshold: string;
  questions: Question[];
}

export const categories: Category[] = [
  {
    id: 'data',
    name: 'ДАННЫЕ',
    emoji: '📊',
    description: 'Оценка качества и доступности данных в вашей компании',
    warningThreshold: 'Если меньше 4 → ИИ будет работать на некачественных данных',
    questions: [
      {
        id: 1,
        text: 'Сбор: Данные собираются автоматически из надежных источников',
        category: 'data'
      },
      {
        id: 2,
        text: 'Качество: Минимум ошибок, регулярная очистка данных',
        category: 'data'
      },
      {
        id: 3,
        text: 'Доступность: Нужные данные можно получить быстро без участия IT',
        category: 'data'
      },
      {
        id: 4,
        text: 'Интеграция: Данные из разных систем легко сопоставляются',
        category: 'data'
      }
    ]
  },
  {
    id: 'processes',
    name: 'ПРОЦЕССЫ',
    emoji: '⚙️',
    description: 'Оценка стандартизации и эффективности бизнес-процессов',
    warningThreshold: 'Если меньше 3 → сначала нужно стандартизировать процесс',
    questions: [
      {
        id: 5,
        text: 'Описание: Процесс четко документирован, есть регламенты',
        category: 'processes'
      },
      {
        id: 6,
        text: 'Стабильность: Результат процесса предсказуем',
        category: 'processes'
      },
      {
        id: 7,
        text: 'Измеримость: Есть KPI для оценки эффективности',
        category: 'processes'
      },
      {
        id: 8,
        text: 'Повторяемость: Процесс выполняется одинаково разными сотрудниками',
        category: 'processes'
      }
    ]
  },
  {
    id: 'people',
    name: 'ЛЮДИ',
    emoji: '👥',
    description: 'Оценка готовности команды к внедрению изменений',
    warningThreshold: 'Если меньше 3 → высокий риск сопротивления внедрению',
    questions: [
      {
        id: 9,
        text: 'Компетенции: Сотрудники имеют навыки работы с данными',
        category: 'people'
      },
      {
        id: 10,
        text: 'Мотивация: Команда готова к изменениям и автоматизации',
        category: 'people'
      },
      {
        id: 11,
        text: 'Взаимодействие: Четкое разделение зон ответственности',
        category: 'people'
      },
      {
        id: 12,
        text: 'Обучение: Регулярное повышение квалификации сотрудников',
        category: 'people'
      }
    ]
  },
  {
    id: 'results',
    name: 'РЕЗУЛЬТАТЫ',
    emoji: '🎯',
    description: 'Оценка измеримости и мониторинга результатов',
    warningThreshold: 'Если меньше 4 → будет сложно оценить эффект от внедрения ИИ',
    questions: [
      {
        id: 13,
        text: 'Измеримость: Результаты процесса можно количественно оценить',
        category: 'results'
      },
      {
        id: 14,
        text: 'Целеполагание: Есть четкие цели для автоматизации',
        category: 'results'
      },
      {
        id: 15,
        text: 'Мониторинг: Эффективность процесса регулярно отслеживается',
        category: 'results'
      },
      {
        id: 16,
        text: 'Оптимизация: Процесс постоянно анализируется и улучшается',
        category: 'results'
      }
    ]
  }
];

// Шкала оценки для всех вопросов
export const ratingScale = [
  { value: 1, label: 'Полный хаос', description: 'Процесс не описан, каждый работает по-своему' },
  { value: 2, label: 'Начальная стадия', description: 'Есть понимание проблемы, но нет системного подхода' },
  { value: 3, label: 'Частичная стандартизация', description: 'Есть базовые правила, но много исключений' },
  { value: 4, label: 'Хорошая организация', description: 'Процесс в основном формализован и работает стабильно' },
  { value: 5, label: 'Идеальная система', description: 'Процесс полностью формализован и постоянно улучшается' }
];

// Интерпретация результатов
export interface ResultInterpretation {
  range: string;
  level: 'high-risk' | 'preparation' | 'ready';
  emoji: string;
  title: string;
  description: string;
  recommendations: string[];
}

export const interpretations: ResultInterpretation[] = [
  {
    range: '0-8',
    level: 'high-risk',
    emoji: '🔴',
    title: 'Зона высокого риска',
    description: 'Внедрение ИИ приведет к увеличению хаоса. Сначала нужно:',
    recommendations: [
      'Стандартизировать ключевые процессы',
      'Наладить сбор и качество данных',
      'Подготовить команду к изменениям'
    ]
  },
  {
    range: '9-14',
    level: 'preparation',
    emoji: '🟡',
    title: 'Зона подготовки',
    description: 'Есть потенциал для внедрения ИИ, но требуется предварительная работа:',
    recommendations: [
      'Выберите 1-2 процесса с наибольшими баллами для пилота',
      'Разработайте дорожную карту улучшения слабых мест',
      'Начните с автоматизации простых, повторяющихся задач'
    ]
  },
  {
    range: '15-20',
    level: 'ready',
    emoji: '🟢',
    title: 'Зона готовности',
    description: 'Ваша компания готова к системному внедрению ИИ:',
    recommendations: [
      'Можно начинать с комплексных проектов',
      'Фокус на предиктивной аналитике и оптимизации',
      'Быстрое получение измеримых результатов'
    ]
  }
];
