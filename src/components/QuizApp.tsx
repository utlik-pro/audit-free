import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        if (selectedAnswers[0] === 'Свой вариант') {
          const newCustomAnswers = { ...customAnswers };
          delete newCustomAnswers['custom1'];
          setCustomAnswers(newCustomAnswers);
        }
        setSelectedAnswers([answer]);
      }
    }
  };

  const handleNextQuestion = async () => {
    if (selectedAnswers.length === 0) return;
    
    // Проверяем, что для всех "Свой вариант" заполнены кастомные ответы
    const hasCustom = selectedAnswers.includes('Свой вариант');
    if (hasCustom && (!customAnswers['custom1'] || !customAnswers['custom1'].trim())) {
      return;
    }

    const customAnswersList = selectedAnswers
      .filter(a => a === 'Свой вариант')
      .map(() => customAnswers['custom1'])
      .filter(Boolean);

    const newResponse: QuizResponse = {
      questionId: selectedSection!.questions[currentQuestionIndex].id,
      answers: selectedAnswers,
      customAnswers: customAnswersList.length > 0 ? customAnswersList : undefined
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
          answers: response.answers,
          customAnswers: response.customAnswers || []
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
        const newCustomAnswers: { [key: string]: string } = {};
        if (previousResponse.customAnswers && previousResponse.customAnswers[0]) {
          newCustomAnswers['custom1'] = previousResponse.customAnswers[0];
        }
        setCustomAnswers(newCustomAnswers);
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
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center items-center gap-4 mb-8 mt-10">
          <img src="/mainlogo.png" alt="M.AI.N" className="h-12 w-auto" />
          <span className="text-2xl font-light text-muted-foreground">×</span>
          <img src="/Utlik_LogoBlack.png" alt="Utlik" className="h-6 w-auto" />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Анонимный опрос сотрудников
          </h1>
          <p className="text-lg text-muted-foreground">
            Выберите ваш отдел для начала опроса
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              className="group cursor-pointer transition-all duration-300 hover:scale-105 bg-glass/30 backdrop-blur-glass border-glass-border/50 hover:bg-glass-hover/40 shadow-glass"
              onClick={() => handleDepartmentSelect(dept)}
            >
              <div className="p-8 text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {dept.emoji}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {dept.name}
                </h3>
                <div className="text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center items-center gap-4 mb-8 mt-10">
          <img src="/mainlogo.png" alt="M.AI.N" className="h-12 w-auto" />
          <span className="text-2xl font-light text-muted-foreground">×</span>
          <img src="/Utlik_LogoBlack.png" alt="Utlik" className="h-6 w-auto" />
        </div>
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentStep('department');
              setSelectedAnswers([]);
              setCustomAnswers({});
              setResponses([]);
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к отделам
          </Button>
          
          <div className="text-3xl mb-4">{selectedDepartment?.emoji}</div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {selectedDepartment?.name}
          </h2>
          <p className="text-lg text-muted-foreground">
            Выберите вашу должностную категорию
          </p>
        </div>

        <div className="space-y-4">
          {selectedDepartment?.sections.map((section, index) => (
            <Card
              key={index}
              className="group cursor-pointer transition-all duration-300 hover:scale-102 bg-glass/30 backdrop-blur-glass border-glass-border/50 hover:bg-glass-hover/40 shadow-soft"
              onClick={() => handlePositionSelect(section)}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {section.position}
                </h3>
                <p className="text-muted-foreground">
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
      <div className="min-h-screen bg-gradient-background p-6">
        <div className="max-w-3xl mx-auto mt-10">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img src="/mainlogo.png" alt="M.AI.N" className="h-12 w-auto" />
            <span className="text-2xl font-light text-muted-foreground">×</span>
            <img src="/Utlik_LogoBlack.png" alt="Utlik" className="h-6 w-auto" />
          </div>
          
          {/* Department and Position Info */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-glass/30 backdrop-blur-glass rounded-full border border-glass-border/30">
              <span className="text-2xl">{selectedDepartment?.emoji}</span>
              <span className="text-sm font-medium text-foreground">{selectedDepartment?.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm font-medium text-foreground">{selectedSection?.position}</span>
            </div>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={currentQuestionIndex === 0 ? () => {
                  setCurrentStep('position');
                  setSelectedAnswers([]);
                  setCustomAnswers({});
                } : handlePreviousQuestion}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentQuestionIndex === 0 ? 'К выбору должности' : 'Предыдущий вопрос'}
              </Button>
              <div className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} из {selectedSection!.questions.length}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-secondary/30 rounded-full h-2 mb-6">
              <div 
                className="h-2 rounded-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass mb-8">
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-foreground mb-4 leading-relaxed">
                {currentQuestion.text}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {currentQuestion.multipleChoice !== false ? (
                  <>Выберите 1 или 2 варианта ответа • Выбрано: {selectedAnswers.length}/2</>
                ) : (
                  <>Выберите один вариант ответа</>
                )}
              </p>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index}>
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedAnswers.includes(option)
                          ? 'bg-primary/20 border-primary/40 shadow-soft'
                          : 'bg-glass/20 hover:bg-glass-hover/30 border-glass-border/30'
                      }`}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      <div className="p-4 flex items-center">
                        <div className={`w-5 h-5 ${currentQuestion.multipleChoice !== false ? 'rounded' : 'rounded-full'} border-2 mr-4 flex items-center justify-center ${
                          selectedAnswers.includes(option)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}>
                          {selectedAnswers.includes(option) && (
                            currentQuestion.multipleChoice !== false ? (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )
                          )}
                        </div>
                        <span className="text-foreground font-medium">{option}</span>
                        {selectedAnswers.includes(option) && currentQuestion.multipleChoice !== false && (
                          <span className="ml-auto text-xs text-primary font-semibold">
                            {selectedAnswers.indexOf(option) + 1}
                          </span>
                        )}
                      </div>
                    </Card>
                    
                    {selectedAnswers.includes('Свой вариант') && option === 'Свой вариант' && (
                      <div className="mt-3 ml-9">
                        <input
                          type="text"
                          value={customAnswers['custom1'] || ''}
                          onChange={(e) => setCustomAnswers({ ...customAnswers, custom1: e.target.value })}
                          placeholder="Укажите ваш вариант..."
                          className="w-full p-3 rounded-lg bg-glass/30 border border-glass-border/50 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Next Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswers.length === 0 || (selectedAnswers.includes('Свой вариант') && (!customAnswers['custom1'] || !customAnswers['custom1'].trim())) || isSubmitting}
              className="bg-gradient-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохраняем...' : currentQuestionIndex === selectedSection!.questions.length - 1 ? 'Завершить опрос' : 'Следующий вопрос'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderComplete = () => (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <div className="flex justify-center items-center gap-4 mb-8">
          <img src="/mainlogo.png" alt="M.AI.N" className="h-12 w-auto" />
          <span className="text-2xl font-light text-muted-foreground">×</span>
          <img src="/Utlik_LogoBlack.png" alt="Utlik" className="h-6 w-auto" />
        </div>
        <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass">
          <div className="p-12">
            <div className="text-6xl mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Спасибо за участие!
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Ваши ответы были успешно сохранены. Результаты опроса помогут улучшить рабочие процессы в компании.
            </p>

            <div className="bg-secondary/20 rounded-lg p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-3">
                Присоединяйтесь к сообществу <span className="font-semibold">M.AI.N — AI Community</span>,
                где мы делимся самыми последними новостями в мире ИИ, практиками и кейсами.
              </p>
              <a
                href="https://t.me/maincomby"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="glass-card">Вступить в M.AI.N — AI Community</Button>
              </a>
            </div>
            
            <div className="bg-secondary/20 rounded-lg p-6 mb-8">
              <div className="text-sm text-muted-foreground mb-2">Отдел:</div>
              <div className="font-semibold text-foreground mb-4">{selectedDepartment?.name}</div>
              
              <div className="text-sm text-muted-foreground mb-2">Должность:</div>
              <div className="font-semibold text-foreground mb-4">{selectedSection?.position}</div>
              
              <div className="text-sm text-muted-foreground mb-2">Отвечено вопросов:</div>
              <div className="font-semibold text-foreground">{responses.length}</div>
            </div>
            
            <Button
              onClick={resetQuiz}
              className="bg-gradient-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold shadow-soft"
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