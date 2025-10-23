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

  // Автоматически открываем при первом вопросе
  useEffect(() => {
    if (autoOpen) {
      // Небольшая задержка для плавности
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

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
