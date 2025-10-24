import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Share2, Copy, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { categories, interpretations, ResultInterpretation } from '@/data/quizData';
import { generateDiagnosticPDF } from '@/utils/pdfGenerator';
import { ResultsRadarChart } from '@/components/ResultsRadarChart';

interface ResultsData {
  auditNumber: number;
  totalScore: number;
  categoryScores: {
    data: number;
    processes: number;
    people: number;
    results: number;
  };
  interpretation: ResultInterpretation;
  contactInfo: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  completedAt: Date;
}

export const Results = () => {
  const { auditNumber } = useParams<{ auditNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!auditNumber) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('audit_number', parseInt(auditNumber))
          .eq('department', 'diagnostic')
          .single();

        if (error || !data) {
          toast({
            title: "Результаты не найдены",
            description: "Проверьте номер аудита и попробуйте еще раз",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const answers = JSON.parse(data.answers);
        const interpretation = interpretations.find(
          i => i.title === answers.interpretation
        ) || interpretations[0];

        setResultsData({
          auditNumber: data.audit_number,
          totalScore: answers.totalScore,
          categoryScores: answers.categoryScores,
          interpretation,
          contactInfo: answers.contactInfo,
          completedAt: new Date(data.created_at),
        });
      } catch (error) {
        console.error('Error fetching results:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить результаты",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [auditNumber, navigate, toast]);

  const handleDownloadPDF = async () => {
    if (!resultsData) return;

    try {
      await generateDiagnosticPDF({
        totalScore: resultsData.totalScore,
        categoryScores: resultsData.categoryScores,
        interpretation: resultsData.interpretation,
        contactInfo: resultsData.contactInfo,
        auditNumber: resultsData.auditNumber,
        completedAt: resultsData.completedAt,
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

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Мои результаты AI Readiness диагностики: ${resultsData?.totalScore}/20`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Readiness Диагностика',
          text,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - копируем в буфер
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Ссылка скопирована!",
        description: "Поделитесь результатами с коллегами",
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-xl text-foreground mb-2">Загрузка результатов...</div>
          <div className="text-sm text-muted-foreground">Пожалуйста, подождите</div>
        </div>
      </div>
    );
  }

  if (!resultsData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-background overflow-auto p-4 sm:p-6 pt-24 pb-24">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-glass/40 backdrop-blur-glass border-glass-border/50 shadow-glass mb-6">
          <div className="p-6 sm:p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{resultsData.interpretation.emoji}</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Номер аудита: {resultsData.auditNumber.toString().padStart(6, '0')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                {resultsData.interpretation.title}
              </h2>
              <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
                Общий балл: {resultsData.totalScore} из 20
              </div>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                {resultsData.interpretation.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Скачать PDF
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="px-6 py-3 rounded-lg font-semibold"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Поделиться
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="px-6 py-3 rounded-lg font-semibold"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Копировать ссылку
                </Button>
              </div>

              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="mt-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Пройти диагностику
              </Button>
            </div>

            {/* Radar Chart Visualization */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4 text-center">
                Визуализация результатов
              </h3>
              <Card className="bg-glass/20 border-glass-border/30 p-6">
                <ResultsRadarChart categoryScores={resultsData.categoryScores} />
              </Card>
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
                        {resultsData.categoryScores[category.id as keyof typeof resultsData.categoryScores] || 0} / 5
                      </div>
                    </div>
                  </div>
                  {/* Показываем предупреждение если балл меньше порога */}
                  {((category.id === 'data' || category.id === 'results') &&
                    (resultsData.categoryScores[category.id as keyof typeof resultsData.categoryScores] || 0) < 4) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      {category.warningThreshold}
                    </p>
                  )}
                  {((category.id === 'processes' || category.id === 'people') &&
                    (resultsData.categoryScores[category.id as keyof typeof resultsData.categoryScores] || 0) < 3) && (
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
                {resultsData.interpretation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div className="bg-secondary/20 rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-3">
                Присоединяйтесь к сообществу <span className="font-semibold">M.AI.N — AI Community</span>, где мы делимся самыми последними новостями в мире ИИ, практиками и кейсами.
              </p>
              <a href="https://t.me/maincomby" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  Вступить в M.AI.N — AI Community
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
