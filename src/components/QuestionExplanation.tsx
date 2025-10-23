import { useState, useEffect } from "react";
import { Question } from "@/data/quizData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface QuestionExplanationProps {
  question: Question;
  isMobile?: boolean;
  autoOpen?: boolean;
}

export const QuestionExplanation = ({ question, isMobile = false, autoOpen = false }: QuestionExplanationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Автоматически открываем при каждом новом вопросе
  useEffect(() => {
    if (autoOpen) {
      // Сначала закрываем (если было открыто)
      setIsOpen(false);
      // Небольшая задержка для плавности открытия
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Если autoOpen = false, закрываем
      setIsOpen(false);
    }
  }, [autoOpen, question.id]); // Добавили question.id в зависимости

  if (!question.explanation || !question.examples) {
    return null;
  }

  const ExplanationContent = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base mb-2">Что это значит?</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
      </div>

      <div>
        <h3 className="font-semibold text-base mb-2">Примеры:</h3>
        <ul className="space-y-2">
          {question.examples.map((example, index) => (
            <li key={index} className="flex gap-2 text-sm text-gray-700">
              <span className="text-blue-600 font-bold flex-shrink-0">•</span>
              <span className="leading-relaxed">{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Мобильная версия - выдвижная панель снизу
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors cursor-pointer flex-shrink-0 animate-pulse"
            aria-label="Пояснение к вопросу"
          >
            <Info className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-left">{question.text}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-6 mb-4">
            <ExplanationContent />
          </div>
          <div className="border-t pt-4 pb-2">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full bg-gradient-primary hover:opacity-90 text-white py-3 rounded-lg font-semibold text-base"
            >
              Понятно
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Десктоп версия - Popover при наведении/клике
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors cursor-pointer flex-shrink-0 ml-2 animate-pulse hover:animate-none"
          aria-label="Пояснение к вопросу"
        >
          <Info className="w-6 h-6" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-h-[600px] overflow-y-auto p-4"
        side="right"
        align="start"
        sideOffset={10}
      >
        <ExplanationContent />
      </PopoverContent>
    </Popover>
  );
};
