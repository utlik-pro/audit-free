import { QuizApp } from "@/components/QuizApp";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative">
      <QuizApp />
    </div>
  );
};

export default Index;
