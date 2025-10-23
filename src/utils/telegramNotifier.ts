import { interpretations } from '@/data/quizData';

interface TelegramNotificationData {
  name: string;
  company: string;
  phone: string;
  telegram: string;
  email: string;
  totalScore: number;
  categoryScores: {
    data: number;
    processes: number;
    people: number;
    results: number;
  };
}

export async function sendTelegramNotification(data: TelegramNotificationData): Promise<boolean> {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram bot credentials not configured');
    return false;
  }

  // Определяем уровень готовности
  const interpretation = interpretations.find(
    i => {
      const [min, max] = i.range.split('-').map(Number);
      return data.totalScore >= min && data.totalScore <= max;
    }
  ) || interpretations[1];

  // Форматируем сообщение
  const message = `
🎯 <b>Новое прохождение квиза!</b>

👤 <b>Контакт:</b>
• Имя: ${data.name}
• Компания: ${data.company}
• Телефон: ${data.phone}
• Telegram: ${data.telegram}
• Email: ${data.email}

📊 <b>Результаты:</b>
• Общий балл: <b>${data.totalScore}/20</b>
• Данные: ${data.categoryScores.data}/5
• Процессы: ${data.categoryScores.processes}/5
• Люди: ${data.categoryScores.people}/5
• Результаты: ${data.categoryScores.results}/5

${interpretation.emoji} <b>${interpretation.title}</b>
${interpretation.description}

🔗 <a href="${window.location.origin}/admin">Открыть админку</a>
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
      return false;
    }

    console.log('Telegram notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}
