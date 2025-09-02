import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { departments, Department, QuizSection } from '@/data/quizData';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizResponse {
  questionId: number;
  answers: string[];
  customAnswers?: string[];
}

interface QuizSession {
  department: string;
  position: string;
  responses: QuizResponse[];
  completedAt?: Date;
}

export const QuizApp = () => {
  const [currentStep, setCurrentStep] = useState<'department' | 'position' | 'quiz' | 'complete'>('department');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSection, setSelectedSection] = useState<QuizSection | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [customAnswers, setCustomAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setCurrentStep('position');
    // Сброс на случай если пользователь возвращается назад
    setSelectedAnswers([]);
    setCustomAnswers({});
    setResponses([]);
  };

  const handlePositionSelect = (section: QuizSection) => {
    setSelectedSection(section);
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setResponses([]);
    setSelectedAnswers([]);
    setCustomAnswers({});
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = selectedSection!.questions[currentQuestionIndex];
    // По умолчанию множественный выбор, кроме вопросов где явно указано false
    const isMultipleChoice = currentQuestion.multipleChoice !== false;
    
    if (selectedAnswers.includes(answer)) {
      // Снять выбор
      setSelectedAnswers(selectedAnswers.filter(a => a !== answer));
      if (answer === 'Свой вариант') {
        const newCustomAnswers = { ...customAnswers };
        delete newCustomAnswers['custom1'];
        setCustomAnswers(newCustomAnswers);
      }
    } else {
      if (isMultipleChoice) {
        // Множественный выбор - до 2 вариантов
        if (selectedAnswers.length < 2) {
          setSelectedAnswers([...selectedAnswers, answer]);
        } else {
          toast({
            title: "Максимум 2 варианта",
            description: "Сначала снимите один из выбранных вариантов",
            variant: "default",
          });
        }
      } else {
        // Одиночный выбор - заменяем предыдущий выбор
        setSelectedAnswers([answer]);
      }
    }
  };

  const handleNextQuestion = async () => {
    if (selectedAnswers.length === 0) return;
    
    // Проверяем, что если выбран "Свой вариант", то введен текст
    if (selectedAnswers.includes('Свой вариант')) {
      if (!customAnswers['custom1'] || customAnswers['custom1'].trim() === '') {
        toast({
          title: "Требуется ввод",
          description: "Пожалуйста, укажите свой вариант ответа",
          variant: "default",
        });
        return;
      }
    }

    // Сохраняем кастомные ответы
    const customAnswersArray = [];
    if (selectedAnswers.includes('Свой вариант') && customAnswers['custom1']) {
      customAnswersArray.push(customAnswers['custom1'].trim());
    }

    const newResponse: QuizResponse = {
      questionId: selectedSection!.questions[currentQuestionIndex].id,
      answers: selectedAnswers,
      ...(customAnswersArray.length > 0 && { customAnswers: customAnswersArray })
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex < selectedSection!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setCustomAnswers({});
    } else {
      // Quiz completed - save to database
      setIsSubmitting(true);
      
      try {
        const questions = selectedSection!.questions;
        const processedAnswers = updatedResponses.map((response, index) => ({
          questionText: questions[index].text,
          answers: response.answers
        }));

        const { error } = await supabase
          .from('quiz_responses')
          .insert({
            department: selectedDepartment!.id,
            position: selectedSection!.position,
            questions: JSON.stringify(questions),
            answers: JSON.stringify(processedAnswers)
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Спасибо за участие!",
          description: "Ваши ответы успешно сохранены.",
        });
        
        setCurrentStep('complete');
      } catch (error) {
        console.error('Error saving quiz response:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить ответы. Попробуйте еще раз.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const previousResponse = responses[currentQuestionIndex - 1];
      if (previousResponse) {
        setSelectedAnswers(previousResponse.answers);
      }
      setResponses(responses.slice(0, currentQuestionIndex));
    }
  };

  const resetQuiz = () => {
    setCurrentStep('department');
    setSelectedDepartment(null);
    setSelectedSection(null);
    setCurrentQuestionIndex(0);
    setResponses([]);
    setSelectedAnswers([]);
    setCustomAnswers({});
  };

  const renderDepartmentSelection = () => (
    <div className="h-screen bg-gradient-background flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-4xl flex flex-col">
        <div className="text-center mb-2 sm:mb-3 flex-shrink-0">
          <h1 className="text-3xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2 px-4">
            Анонимный опрос сотрудников
          </h1>
          <p className="text-lg sm:text-lg text-muted-foreground px-4">
            Выберите ваш отдел для начала опроса
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              className="group cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 bg-glass/30 backdrop-blur-glass border-glass-border/50 hover:bg-glass-hover/40 shadow-glass touch-manipulation relative overflow-hidden"
              onClick={() => handleDepartmentSelect(dept)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty('--mouse-x', '50%');
                e.currentTarget.style.setProperty('--mouse-y', '50%');
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-400/25 via-purple-400/25 to-pink-400/25 blur-2xl" 
                     style={{
                       left: 'var(--mouse-x)',
                       top: 'var(--mouse-y)',
                     }}
                />
              </div>
              <div className="py-1 px-2 sm:py-1.5 sm:px-3 md:py-2 md:px-3 text-center min-h-[40px] sm:min-h-[50px] md:min-h-[60px] flex flex-col justify-center relative z-10">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-0 sm:mb-0.5 md:mb-1 group-hover:scale-110 transition-transform duration-300">
                  {dept.emoji}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-0">
                  {dept.name}
                </h3>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {dept.sections.length} категории должностей
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPositionSelection = () => (
    <div className="h-screen bg-gradient-background flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="w-full max-w-2xl h-full flex flex-col justify-center pt-20 sm:pt-24">
        {/* Убираем дублирующийся логотип полностью */}
        <div className="text-center mb-6 sm:mb-12 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentStep('department');
              setSelectedAnswers([]);
              setCustomAnswers({});
              setResponses([]);
            }}
            className="mb-3 sm:mb-4 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к отделам
          </Button>
          
          <div className="text-4xl sm:text-3xl mb-2 sm:mb-4">{selectedDepartment?.emoji}</div>
          <h2 className="text-3xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-4 px-4">
            {selectedDepartment?.name}
          </h2>
          <p className="text-lg sm:text-lg text-muted-foreground px-4">
            Выберите вашу должностную категорию
          </p>
        </div>

        <div className="space-y-2 sm:space-y-4 flex-1">
          {selectedDepartment?.sections.map((section, index) => (
            <Card
              key={index}
              className="group cursor-pointer transition-all duration-300 hover:scale-102 active:scale-95 bg-glass/30 backdrop-blur-glass border-glass-border/50 hover:bg-glass-hover/40 shadow-soft touch-manipulation relative overflow-hidden"
              onClick={() => handlePositionSelect(section)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty('--mouse-x', '50%');
                e.currentTarget.style.setProperty('--mouse-y', '50%');
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400/25 via-blue-400/25 to-purple-400/25 blur-2xl" 
                     style={{
                       left: 'var(--mouse-x)',
                       top: 'var(--mouse-y)',
                     }}
                />
              </div>
              <div className="p-3 sm:p-5 md:p-6 min-h-[60px] sm:min-h-[80px] flex flex-col justify-center relative z-10">
                <h3 className="text-lg sm:text-lg md:text-xl font-semibold text-foreground mb-1 sm:mb-2">
                  {section.position}
                </h3>
                <p className="text-base sm:text-base text-muted-foreground">
                  {section.questions.length} вопросов в анкете
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentQuestion = selectedSection!.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedSection!.questions.length) * 100;

    return (
      <div className="h-screen bg-gradient-background overflow-hidden relative">
        {/* Main content area */}
        <div className="h-full pb-16 sm:pb-0 flex flex-col p-0 sm:p-6 pt-20 sm:pt-24">
          <div className="sm:max-w-3xl mx-auto h-full flex flex-col w-full">
            {/* Department and Position Info - mobile optimized */}
            <div className="text-center mb-2 sm:mb-6 flex-shrink-0 px-3 sm:px-0">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1 sm:py-2 bg-glass/30 backdrop-blur-glass rounded-full border border-glass-border/30 text-xs sm:text-sm whitespace-nowrap">
                <span className="text-sm sm:text-xl">{selectedDepartment?.emoji}</span>
                <span className="font-medium text-foreground">{selectedDepartment?.name}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-foreground">{selectedSection?.position}</span>
              </div>
            </div>
            
            {/* Header - mobile optimized */}
            <div className="mb-2 sm:mb-6 flex-shrink-0 px-3 sm:px-0">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <Button
                  variant="ghost"
                  onClick={currentQuestionIndex === 0 ? () => {
                    setCurrentStep('position');
                    setSelectedAnswers([]);
                    setCustomAnswers({});
                  } : handlePreviousQuestion}
                  className="text-muted-foreground text-sm sm:text-sm touch-manipulation min-h-[48px] sm:min-h-[44px] px-3 sm:px-4"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4 mr-2 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {currentQuestionIndex === 0 ? 'К выбору должности' : 'Предыдущий вопрос'}
                  </span>
                  <span className="sm:hidden">Назад</span>
                </Button>
                <div className="text-sm sm:text-sm text-muted-foreground font-medium">
                  {currentQuestionIndex + 1} из {selectedSection!.questions.length}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-secondary/30 rounded-full h-1 sm:h-2">
                <div 
                  className="h-1 sm:h-2 rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card - mobile optimized without scrolling, full width on mobile */}
            <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass flex flex-col overflow-hidden mx-0 sm:mx-0 rounded-none sm:rounded-lg">
              <div className="p-2 sm:p-3 md:p-4 flex flex-col">
                <div className="flex-shrink-0 mb-2 sm:mb-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-4 leading-tight sm:leading-relaxed">
                    {currentQuestion.text}
                  </h3>
                  <p className="text-sm sm:text-sm text-muted-foreground">
                    {currentQuestion.multipleChoice !== false ? (
                      <>
                        <span className="hidden sm:inline">Выберите 1 или 2 варианта ответа • Выбрано: {selectedAnswers.length}/2</span>
                        <span className="sm:hidden">1-2 варианта • {selectedAnswers.length}/2</span>
                      </>
                    ) : (
                      <>Выберите один вариант</>
                    )}
                  </p>
                </div>
                
                <div className="">
                  <div className="space-y-1 sm:space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index}>
                        <Card
                          className={`cursor-pointer transition-all duration-200 touch-manipulation active:scale-95 ${
                            selectedAnswers.includes(option)
                              ? 'bg-primary/20 border-primary/40 shadow-soft'
                              : 'bg-glass/20 hover:bg-glass-hover/30 border-glass-border/30'
                          }`}
                          onClick={() => handleAnswerSelect(option)}
                        >
                          <div className="p-4 sm:p-4 flex items-center min-h-[52px] sm:min-h-[56px]">
                            <div className={`w-5 h-5 sm:w-5 sm:h-5 ${currentQuestion.multipleChoice !== false ? 'rounded' : 'rounded-full'} border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 ${
                              selectedAnswers.includes(option)
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedAnswers.includes(option) && (
                                currentQuestion.multipleChoice !== false ? (
                                  <svg className="w-3 h-3 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-2 h-2 sm:w-2 sm:h-2 rounded-full bg-white" />
                                )
                              )}
                            </div>
                            <span className="text-sm sm:text-base text-foreground font-medium flex-1 pr-2 sm:pr-2 leading-snug">{option}</span>
                            {selectedAnswers.includes(option) && currentQuestion.multipleChoice !== false && (
                              <span className="text-xs text-primary font-semibold bg-primary/10 rounded-full w-5 h-5 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                                {selectedAnswers.indexOf(option) + 1}
                              </span>
                            )}
                          </div>
                        </Card>
                      </div>
                    ))}
                    
                    {selectedAnswers.some(answer => answer === 'Свой вариант') && (
                      <div className="mt-3 sm:mt-4">
                        <Input
                          type="text"
                          placeholder="Укажите свой вариант"
                          value={customAnswers['custom1'] || ''}
                          onChange={(e) => setCustomAnswers({...customAnswers, custom1: e.target.value})}
                          className="w-full p-3 sm:p-4 text-sm sm:text-base border-2 border-primary/20 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50 backdrop-blur-sm touch-manipulation min-h-[48px] sm:min-h-[52px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Fixed bottom button for mobile, inline for desktop */}
        <div className="sm:hidden fixed bottom-6 left-0 right-0 z-50 px-3">
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswers.length === 0 || isSubmitting}
            className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 rounded-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[56px] w-full text-base"
          >
            {isSubmitting ? 'Сохраняем...' : currentQuestionIndex === selectedSection!.questions.length - 1 ? 'Завершить' : 'Далее'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Desktop button */}
        <div className="hidden sm:block absolute bottom-20 right-6">
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswers.length === 0 || isSubmitting}
            className="bg-gradient-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Сохраняем...' : currentQuestionIndex === selectedSection!.questions.length - 1 ? 'Завершить опрос' : 'Следующий вопрос'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderComplete = () => (
    <div className="h-screen bg-gradient-background flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="w-full max-w-2xl text-center h-full flex flex-col justify-center pt-20 sm:pt-24">
        {/* Убираем дублирующийся логотип полностью */}
        <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass">
          <div className="p-6 sm:p-8 md:p-12">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
            </div>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              Спасибо за участие!
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
              Ваши ответы были успешно сохранены. Результаты опроса помогут улучшить рабочие процессы в компании.
            </p>

            <div className="bg-secondary/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 px-2">
                Присоединяйтесь к сообществу <span className="font-semibold">M.AI.N — AI Community</span>,
                где мы делимся самыми последними новостями в мире ИИ, практиками и кейсами.
              </p>
              <a
                href="https://t.me/maincomby"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="glass-card text-xs sm:text-sm touch-manipulation min-h-[44px]">
                  <span className="hidden sm:inline">Вступить в M.AI.N — AI Community</span>
                  <span className="sm:hidden">Вступить в сообщество</span>
                </Button>
              </a>
            </div>
            
            <div className="bg-secondary/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-left">
              <div className="grid grid-cols-2 gap-4 sm:gap-0 sm:block">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Отдел:</div>
                  <div className="font-semibold text-foreground text-sm sm:text-base mb-2 sm:mb-4 break-words">{selectedDepartment?.name}</div>
                </div>
                
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Должность:</div>
                  <div className="font-semibold text-foreground text-sm sm:text-base mb-2 sm:mb-4 break-words">{selectedSection?.position}</div>
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Отвечено вопросов:</div>
                  <div className="font-semibold text-foreground text-sm sm:text-base">{responses.length}</div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={resetQuiz}
              className="bg-gradient-primary hover:opacity-90 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold shadow-soft touch-manipulation min-h-[48px] w-full sm:w-auto text-sm sm:text-base"
            >
              Пройти опрос заново
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  switch (currentStep) {
    case 'department':
      return renderDepartmentSelection();
    case 'position':
      return renderPositionSelection();
    case 'quiz':
      return renderQuiz();
    case 'complete':
      return renderComplete();
    default:
      return renderDepartmentSelection();
  }
};