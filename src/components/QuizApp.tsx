import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { categories, ratingScale, interpretations, Category, ResultInterpretation } from '@/data/quizData';
import { ArrowLeft, ArrowRight, CheckCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateDiagnosticPDF } from '@/utils/pdfGenerator';
import { QuestionExplanation } from '@/components/QuestionExplanation';

interface QuizResponse {
  questionId: number;
  rating: number;
  category: string;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  wantsDeepAudit: boolean;
}

export const QuizApp = () => {
  const [currentStep, setCurrentStep] = useState<'intro' | 'quiz' | 'contact' | 'results'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ name: '', phone: '', email: '', wantsDeepAudit: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditNumber, setAuditNumber] = useState<number | null>(null);
  const { toast } = useToast();

  // Собираем все вопросы из всех категорий
  const allQuestions = categories.flatMap(cat => cat.questions);
  const totalQuestions = allQuestions.length;

  const calculateResults = () => {
    const categoryScores: { [key: string]: number } = {};

    categories.forEach(cat => {
      const categoryResponses = responses.filter(r => r.category === cat.id);
      const sum = categoryResponses.reduce((acc, r) => acc + r.rating, 0);
      // Сохраняем средний балл (от 1 до 5) для каждой категории
      const avgScore = categoryResponses.length > 0 ? Math.round(sum / categoryResponses.length) : 0;
      categoryScores[cat.id] = avgScore;
    });

    // Общий балл - это сумма средних баллов по категориям (макс 20)
    const totalScore = Object.values(categoryScores).reduce((acc, score) => acc + score, 0);

    let interpretation: ResultInterpretation;
    if (totalScore <= 8) {
      interpretation = interpretations[0]; // high-risk
    } else if (totalScore <= 14) {
      interpretation = interpretations[1]; // preparation
    } else {
      interpretation = interpretations[2]; // ready
    }

    return { categoryScores, totalScore, interpretation };
  };

  const handleStartQuiz = () => {
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setResponses([]);
    setSelectedRating(null);
    setAuditNumber(null);
  };

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleNextQuestion = () => {
    if (selectedRating === null) return;

    const currentQuestion = allQuestions[currentQuestionIndex];
    const newResponse: QuizResponse = {
      questionId: currentQuestion.id,
      rating: selectedRating,
      category: currentQuestion.category
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedRating(null);
    } else {
      // Квиз завершен, переходим к форме контактов
      setCurrentStep('contact');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousResponse = responses[currentQuestionIndex - 1];
      if (previousResponse) {
        setSelectedRating(previousResponse.rating);
      }
      setResponses(responses.slice(0, currentQuestionIndex));
    }
  };

  const handleSubmitContact = async () => {
    if (!contactInfo.name || !contactInfo.phone || !contactInfo.email) {
      toast({
        title: "Заполните все поля",
        description: "Пожалуйста, укажите имя, телефон и email",
        variant: "default",
      });
      return;
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactInfo.email)) {
      toast({
        title: "Некорректный email",
        description: "Пожалуйста, введите корректный адрес электронной почты",
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { categoryScores, totalScore, interpretation } = calculateResults();

      const { data, error } = await supabase
        .from('quiz_responses')
        .insert({
          department: 'diagnostic', // Новый тип
          position: interpretation.level,
          questions: JSON.stringify(allQuestions),
          answers: JSON.stringify({
            responses,
            categoryScores,
            totalScore,
            interpretation: interpretation.title,
            contactInfo
          })
        })
        .select('audit_number')
        .single();

      if (error) {
        throw error;
      }

      if (data?.audit_number) {
        setAuditNumber(data.audit_number);
      }

      toast({
        title: "Спасибо за участие!",
        description: "Ваши результаты сохранены. Мы свяжемся с вами в ближайшее время.",
      });

      setCurrentStep('results');
    } catch (error) {
      console.error('Error saving quiz response:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результаты. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep('intro');
    setCurrentQuestionIndex(0);
    setResponses([]);
    setSelectedRating(null);
    setContactInfo({ name: '', phone: '', email: '', wantsDeepAudit: false });
    setAuditNumber(null);
  };

  const renderIntro = () => (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24">
      <div className="w-full max-w-4xl">
        <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass">
          <div className="p-6 sm:p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Диагностика бизнес-процессов для внедрения ИИ
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6">
                Почему 70% проектов по внедрению ИИ терпят неудачу?
              </p>
            </div>

            <div className="prose prose-lg max-w-none mb-8 text-foreground">
              <p className="text-base sm:text-lg mb-6">
                Основная причина — попытка автоматизировать хаотичные процессы. ИИ не исправляет плохие процессы — он их только усугубляет. Прежде чем внедрять технологии, нужно понять, какие процессы готовы к автоматизации, а какие требуют предварительной оптимизации.
              </p>
              <p className="text-base sm:text-lg mb-6">
                Этот фреймворк поможет вам самостоятельно провести первичную диагностику и определить точки роста для внедрения ИИ в вашей компании.
              </p>
            </div>

            <div className="bg-secondary/20 rounded-lg p-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                📊 Диагностика 4 ключевых областей
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Оцените каждый процесс по шкале от 1 до 5:
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <li><strong>1</strong> = Полный хаос (процесс не описан, каждый работает по-своему)</li>
                <li><strong>3</strong> = Частичная стандартизация (есть базовые правила, но много исключений)</li>
                <li><strong>5</strong> = Идеальная система (процесс полностью формализован и постоянно улучшается)</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {categories.map((category) => (
                <Card key={category.id} className="bg-glass/20 border-glass-border/30 p-4">
                  <div className="text-3xl mb-2">{category.emoji}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{category.warningThreshold}</p>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={handleStartQuiz}
                className="bg-gradient-primary hover:opacity-90 text-white px-8 py-6 rounded-lg font-semibold shadow-soft text-lg"
              >
                Начать диагностику
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Займет примерно 5-7 минут
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentQuestion = allQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const currentCategory = categories.find(cat => cat.id === currentQuestion.category);

    return (
      <div className="min-h-screen bg-gradient-background overflow-auto">
        <div className="min-h-screen flex flex-col p-4 sm:p-6 pt-20 sm:pt-24 pb-32 sm:pb-24">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            {/* Категория */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-2 bg-glass/30 backdrop-blur-glass rounded-full border border-glass-border/30">
                <span className="text-2xl">{currentCategory?.emoji}</span>
                <span className="font-bold text-foreground">{currentCategory?.name}</span>
              </div>
            </div>

            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  onClick={currentQuestionIndex === 0 ? () => setCurrentStep('intro') : handlePreviousQuestion}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentQuestionIndex === 0 ? 'К описанию' : 'Назад'}
                </Button>
                <div className="text-sm text-muted-foreground font-medium">
                  Вопрос {currentQuestionIndex + 1} из {totalQuestions}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary/30 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass mb-6">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">
                  {currentQuestion.text}
                </h3>

                <p className="text-sm text-muted-foreground mb-6">
                  Выберите оценку от 1 до 5:
                </p>

                <div className="space-y-3">
                  {ratingScale.map((scale) => (
                    <Card
                      key={scale.value}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedRating === scale.value
                          ? 'bg-primary/20 border-primary/40 shadow-soft scale-[1.02]'
                          : 'bg-glass/20 hover:bg-glass-hover/30 border-glass-border/30'
                      }`}
                      onClick={() => handleRatingSelect(scale.value)}
                    >
                      <div className="p-4 flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg ${
                          selectedRating === scale.value
                            ? 'bg-primary text-white'
                            : 'bg-secondary text-foreground'
                        }`}>
                          {scale.value}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-1">{scale.label}</div>
                          <div className="text-sm text-muted-foreground">{scale.description}</div>
                        </div>
                        {selectedRating === scale.value && (
                          <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleNextQuestion}
                disabled={selectedRating === null}
                className="bg-gradient-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === totalQuestions - 1 ? 'Завершить диагностику' : 'Следующий вопрос'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContactForm = () => (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24">
      <div className="w-full max-w-2xl">
        <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass">
          <div className="p-6 sm:p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Получите результаты диагностики
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Укажите ваши контактные данные, и мы отправим подробные результаты с рекомендациями
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-foreground mb-2 block">
                  Имя *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ваше имя"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  className="w-full p-3 text-base border-2 border-glass-border/30 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-foreground mb-2 block">
                  Телефон *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full p-3 text-base border-2 border-glass-border/30 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="w-full p-3 text-base border-2 border-glass-border/30 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Deep Audit Request */}
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4 border-2 border-primary/20">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="deepAudit"
                    checked={contactInfo.wantsDeepAudit}
                    onChange={(e) => setContactInfo({ ...contactInfo, wantsDeepAudit: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="flex-1">
                    <Label htmlFor="deepAudit" className="font-semibold text-foreground cursor-pointer">
                      Хочу углубленную диагностику!
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Получите бесплатный аудит 2-х процессов вашей компании с конкретным планом внедрения ИИ. Наш эксперт свяжется с вами в течение 24 часов.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">
                  Мы уважаем вашу конфиденциальность. Ваши данные будут использованы только для отправки результатов диагностики.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('quiz')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
                <Button
                  onClick={handleSubmitContact}
                  disabled={isSubmitting || !contactInfo.name || !contactInfo.phone || !contactInfo.email}
                  className="flex-1 bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-soft disabled:opacity-50"
                >
                  {isSubmitting ? 'Отправка...' : 'Получить результаты'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const handleDownloadPDF = async () => {
    const { categoryScores, totalScore, interpretation } = calculateResults();

    if (auditNumber === null) {
      toast({
        title: "Нет номера аудита",
        description: "Перезагрузите результаты или повторите отправку формы.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateDiagnosticPDF({
        totalScore,
        categoryScores: {
          data: categoryScores['data'] || 0,
          processes: categoryScores['processes'] || 0,
          people: categoryScores['people'] || 0,
          results: categoryScores['results'] || 0,
        },
        interpretation,
        contactInfo,
        auditNumber,
        completedAt: new Date(),
      });

      toast({
        title: "PDF сгенерирован!",
        description: "Файл с результатами диагностики загружен",
      });
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      toast({
        title: "Ошибка генерации PDF",
        description: "Не удалось создать файл. Попробуйте еще раз позже.",
        variant: "destructive",
      });
    }
  };

  const renderResults = () => {
    const { categoryScores, totalScore, interpretation } = calculateResults();

    return (
      <div className="min-h-screen bg-gradient-background overflow-auto p-4 sm:p-6 pt-24 pb-24">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass mb-6">
            <div className="p-6 sm:p-8 md:p-12">
              <div className="text-center mb-8">
                  <div className="text-6xl mb-4">{interpretation.emoji}</div>
                  {auditNumber !== null && (
                    <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                      Номер аудита: {auditNumber.toString().padStart(6, '0')}
                    </div>
                  )}
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  {interpretation.title}
                </h2>
                <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
                  Общий балл: {totalScore} из 20
                </div>
                <p className="text-base sm:text-lg text-muted-foreground mb-4">
                  {interpretation.description}
                </p>

                {/* PDF Download Button */}
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold shadow-lg mt-4"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Скачать результаты в PDF
                </Button>
              </div>

              {/* Category Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {categories.map((category) => (
                  <Card key={category.id} className="bg-glass/20 border-glass-border/30 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{category.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{category.name}</h3>
                        <div className="text-2xl font-bold text-primary">
                          {categoryScores[category.id] || 0} / 5
                        </div>
                      </div>
                    </div>
                    {/* Показываем предупреждение если балл меньше порога */}
                    {((category.id === 'data' || category.id === 'results') && (categoryScores[category.id] || 0) < 4) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        {category.warningThreshold}
                      </p>
                    )}
                    {((category.id === 'processes' || category.id === 'people') && (categoryScores[category.id] || 0) < 3) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        {category.warningThreshold}
                      </p>
                    )}
                  </Card>
                ))}
              </div>

              {/* Recommendations */}
              <div className="bg-secondary/20 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Рекомендации:
                </h3>
                <ul className="space-y-3">
                  {interpretation.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info Confirmation */}
              <div className="bg-secondary/20 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-foreground mb-3">
                  Результаты будут отправлены на:
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Имя:</strong> {contactInfo.name}</p>
                  <p><strong>Телефон:</strong> {contactInfo.phone}</p>
                  <p><strong>Email:</strong> {contactInfo.email}</p>
                </div>
              </div>

              {/* Deep Audit Status */}
              {contactInfo.wantsDeepAudit ? (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 mb-6 border-2 border-green-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Запрос на углубленную диагностику принят!
                      </h3>
                      <p className="text-muted-foreground">
                        Наш эксперт свяжется с вами в течение 24 часов для согласования деталей бесплатного аудита 2-х процессов вашей компании.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Хотите углубленную диагностику?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Мы предлагаем бесплатный аудит 2-х процессов вашей компании с конкретным планом внедрения ИИ. Вернитесь к форме контактов и отметьте эту опцию.
                  </p>
                </div>
              )}

              {/* Community */}
              <div className="bg-secondary/20 rounded-lg p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Присоединяйтесь к сообществу <span className="font-semibold">M.AI.N — AI Community</span>, где мы делимся самыми последними новостями в мире ИИ, практиками и кейсами.
                </p>
                <a href="https://t.me/maincomby" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    Вступить в M.AI.N — AI Community
                  </Button>
                </a>
              </div>

              <div className="text-center">
                <Button
                  onClick={resetQuiz}
                  className="bg-gradient-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold shadow-soft"
                >
                  Пройти диагностику заново
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  switch (currentStep) {
    case 'intro':
      return renderIntro();
    case 'quiz':
      return renderQuiz();
    case 'contact':
      return renderContactForm();
    case 'results':
      return renderResults();
    default:
      return renderIntro();
  }
};
