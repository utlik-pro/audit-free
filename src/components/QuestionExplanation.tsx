import { Question } from "@/data/quizData";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface QuestionExplanationProps {
  question: Question;
  isMobile?: boolean;
}

export const QuestionExplanation = ({ question, isMobile = false }: QuestionExplanationProps) => {
  if (!question.explanation || !question.examples) {
    return null;
  }

  const ExplanationContent = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">Что это значит?</h3>
        <p className="text-gray-700 leading-relaxed">{question.explanation}</p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-3">Примеры:</h3>
        <ul className="space-y-2">
          {question.examples.map((example, index) => (
            <li key={index} className="flex gap-2 text-gray-700">
              <span className="text-blue-600 font-bold flex-shrink-0">•</span>
              <span className="leading-relaxed">{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Мобильная версия - выдвижная панель
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-2"
          >
            <Info className="w-4 h-4" />
            Подробнее о вопросе
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">{question.text}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ExplanationContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Десктоп версия - карточка справа
  return (
    <Card className="p-6 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-2 mb-4">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <h3 className="font-semibold text-lg text-blue-900">Пояснение</h3>
      </div>
      <ExplanationContent />
    </Card>
  );
};
