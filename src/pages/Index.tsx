import QuizApp from "@/components/QuizApp";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative">
      <Button
        onClick={() => navigate('/admin')}
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 z-10 glass-card"
      >
        <Settings className="mr-2 h-4 w-4" />
        Админка
      </Button>
      <QuizApp />
    </div>
  );
};

export default Index;
