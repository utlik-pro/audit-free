import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-background p-4 sm:p-6 pt-20 sm:pt-24 pb-24">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass">
          <div className="p-6 sm:p-8 md:p-12">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
              Политика конфиденциальности
            </h1>

            <div className="prose prose-sm sm:prose-base max-w-none text-foreground space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Общие положения</h2>
                <p className="text-muted-foreground mb-4">
                  Настоящая Политика конфиденциальности персональных данных (далее – Политика) действует в отношении всей информации, которую сервис диагностики готовности к внедрению ИИ "Audit Free" (далее – Сервис) может получить о Пользователе во время использования сайта.
                </p>
                <p className="text-muted-foreground">
                  Использование Сервиса означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями обработки его персональной информации.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Персональные данные пользователей</h2>
                <p className="text-muted-foreground mb-4">
                  В рамках использования Сервиса мы собираем следующую информацию:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Имя и фамилия</li>
                  <li>Название компании</li>
                  <li>Номер телефона</li>
                  <li>Адрес электронной почты</li>
                  <li>Результаты прохождения диагностического опроса</li>
                </ul>
                <p className="text-muted-foreground">
                  Персональные данные предоставляются Пользователем добровольно при заполнении формы обратной связи после прохождения диагностики.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Цели сбора персональной информации</h2>
                <p className="text-muted-foreground mb-4">
                  Персональные данные Пользователя используются в следующих целях:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Отправка результатов диагностики</li>
                  <li>Связь с Пользователем для предоставления консультаций по результатам диагностики</li>
                  <li>Предоставление услуги углубленного аудита (при выборе соответствующей опции)</li>
                  <li>Улучшение качества Сервиса и его функциональности</li>
                  <li>Статистический анализ обезличенных данных</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Защита персональной информации</h2>
                <p className="text-muted-foreground mb-4">
                  Мы принимаем необходимые организационные и технические меры для защиты персональной информации Пользователя от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения, а также от иных неправомерных действий третьих лиц.
                </p>
                <p className="text-muted-foreground">
                  Данные хранятся на защищенных серверах с использованием современных методов шифрования и защиты.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Передача данных третьим лицам</h2>
                <p className="text-muted-foreground mb-4">
                  Мы не передаем персональные данные третьим лицам, за исключением следующих случаев:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Пользователь явно выразил согласие на такие действия</li>
                  <li>Передача необходима для предоставления запрошенной Пользователем услуги</li>
                  <li>Передача предусмотрена законодательством Российской Федерации</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Права пользователя</h2>
                <p className="text-muted-foreground mb-4">
                  Пользователь имеет право:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Получать информацию о хранящихся персональных данных</li>
                  <li>Требовать уточнения, обновления или удаления своих персональных данных</li>
                  <li>Отозвать согласие на обработку персональных данных</li>
                  <li>Обжаловать действия или бездействие администрации Сервиса</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Cookies и технологии отслеживания</h2>
                <p className="text-muted-foreground">
                  Сервис может использовать технологию cookies для улучшения пользовательского опыта и анализа использования сайта. Пользователь может настроить свой браузер для отказа от cookies, однако это может повлиять на функциональность Сервиса.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Изменение Политики конфиденциальности</h2>
                <p className="text-muted-foreground">
                  Администрация Сервиса оставляет за собой право вносить изменения в настоящую Политику конфиденциальности. При внесении изменений в актуальной редакции указывается дата последнего обновления. Новая редакция Политики вступает в силу с момента её размещения.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Обратная связь</h2>
                <p className="text-muted-foreground mb-4">
                  По всем вопросам, касающимся обработки персональных данных, Пользователь может обращаться по адресу электронной почты:{' '}
                  <a href="mailto:dev@utlik.pro" className="text-primary hover:underline">
                    dev@utlik.pro
                  </a>
                </p>
              </section>

              <div className="bg-secondary/20 rounded-lg p-4 mt-8">
                <p className="text-sm text-muted-foreground">
                  Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
