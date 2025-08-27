import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { departments, Department, QuizSection } from '@/data/quizData';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizResponse {
  questionId: number;
  answer: string;
  customAnswer?: string;
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
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setCurrentStep('position');
  };

  const handlePositionSelect = (section: QuizSection) => {
    setSelectedSection(section);
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setResponses([]);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer !== 'Свой вариант') {
      setCustomAnswer('');
    }
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer) return;

    const newResponse: QuizResponse = {
      questionId: selectedSection!.questions[currentQuestionIndex].id,
      answer: selectedAnswer,
      customAnswer: selectedAnswer === 'Свой вариант' ? customAnswer : undefined
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex < selectedSection!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setCustomAnswer('');
    } else {
      // Quiz completed - save to database
      setIsSubmitting(true);
      
      try {
        const questions = selectedSection!.questions;
        const processedAnswers = updatedResponses.map((response, index) => ({
          questionText: questions[index].text,
          answer: response.answer,
          customAnswer: response.customAnswer || ''
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
        setSelectedAnswer(previousResponse.answer);
        setCustomAnswer(previousResponse.customAnswer || '');
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
    setSelectedAnswer('');
    setCustomAnswer('');
  };

  const renderDepartmentSelection = () => (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
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
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep('department')}
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={currentQuestionIndex === 0 ? () => setCurrentStep('position') : handlePreviousQuestion}
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
              <h3 className="text-2xl font-semibold text-foreground mb-8 leading-relaxed">
                {currentQuestion.text}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index}>
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedAnswer === option
                          ? 'bg-primary/20 border-primary/40 shadow-soft'
                          : 'bg-glass/20 hover:bg-glass-hover/30 border-glass-border/30'
                      }`}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      <div className="p-4 flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                          selectedAnswer === option
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}>
                          {selectedAnswer === option && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-foreground font-medium">{option}</span>
                      </div>
                    </Card>
                    
                    {selectedAnswer === 'Свой вариант' && option === 'Свой вариант' && (
                      <div className="mt-3 ml-9">
                        <input
                          type="text"
                          value={customAnswer}
                          onChange={(e) => setCustomAnswer(e.target.value)}
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
              disabled={!selectedAnswer || (selectedAnswer === 'Свой вариант' && !customAnswer.trim()) || isSubmitting}
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