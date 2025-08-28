import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download, Users, BarChart3, Clock, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface QuizResponse {
  id: string;
  department: string;
  position: string;
  questions: any;
  answers: any;
  completed_at: string;
  created_at: string;
}

export default function Admin() {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<QuizResponse | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('adminAuthorized') === 'true';
    setAuthorized(isAuth);
    fetchResponses();
  }, []);

  const parseMaybeJson = (value: any) => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value; }
    }
    return value;
  };

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((r: any) => ({
        ...r,
        answers: parseMaybeJson(r.answers) ?? [],
        questions: parseMaybeJson(r.questions) ?? [],
      }));
      setResponses(normalized);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные опросов.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Отдел', 'Позиция', 'Дата завершения', 'Вопросы и ответы'];
    const csvData = responses.map((response: any) => {
      const answersArr = Array.isArray(response.answers)
        ? response.answers
        : (typeof response.answers === 'string' ? parseMaybeJson(response.answers) : []);
      const answersText = (answersArr || []).map((answer: any, index: number) => 
        `Q${index + 1}: ${answer.questionText}\nA: ${answer.answer}${answer.customAnswer ? ` (${answer.customAnswer})` : ''}`
      ).join('\n---\n');
      return [
        response.id,
        response.department,
        response.position,
        new Date(response.completed_at).toLocaleString('ru-RU'),
        answersText,
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-responses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'analytics': 'bg-blue-100 text-blue-800',
      'it': 'bg-green-100 text-green-800',
      'hr': 'bg-purple-100 text-purple-800',
      'marketing': 'bg-orange-100 text-orange-800',
      'legal': 'bg-gray-100 text-gray-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentName = (department: string) => {
    const names: Record<string, string> = {
      'analytics': 'Аналитики',
      'it': 'IT отдел',
      'hr': 'HR отдел',
      'marketing': 'Маркетинг',
      'legal': 'Юридический'
    };
    return names[department] || department;
  };

  const getPositionName = (position: string) => {
    const names: Record<string, string> = {
      'top': 'Топ-менеджеры',
      'middle': 'Среднее звено',
      'junior': 'Рядовые сотрудники'
    };
    return names[position] || position;
  };

  const getStats = () => {
    const total = responses.length;
    const byDepartment = responses.reduce((acc, response) => {
      acc[response.department] = (acc[response.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPosition = responses.reduce((acc, response) => {
      acc[response.position] = (acc[response.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byDepartment, byPosition };
  };

  const stats = getStats();

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-muted/50">
        <Card className="w-full max-w-sm glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Доступ в админку
            </CardTitle>
            <CardDescription>Введите пароль для продолжения</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password === '125690') {
                  localStorage.setItem('adminAuthorized', 'true');
                  setAuthorized(true);
                  setPassword('');
                } else {
                  toast({
                    title: 'Неверный пароль',
                    description: 'Попробуйте снова.',
                    variant: 'destructive',
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="admin-password">Пароль</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="glass-card"
                />
              </div>
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => navigate('/')}>На главную</Button>
                <Button type="submit" className="glass-button">Войти</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedResponse(null)}
            variant="ghost"
            className="mb-6 glass-card"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Button>

          <Card className="glass-card border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl gradient-text">
                Детали ответа
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={getDepartmentColor(selectedResponse.department)}>
                  {getDepartmentName(selectedResponse.department)}
                </Badge>
                <Badge variant="outline">
                  {getPositionName(selectedResponse.position)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Завершен: {new Date(selectedResponse.completed_at).toLocaleString('ru-RU')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(Array.isArray(selectedResponse.answers) ? selectedResponse.answers : (parseMaybeJson(selectedResponse.answers) || [])).map((answer: any, index: number) => (
                  <div key={index} className="border-l-4 border-primary/20 pl-4 py-2 bg-muted/10 rounded-r-lg">
                    <h4 className="font-medium text-foreground mb-2">
                      Вопрос {index + 1}: {answer.questionText}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Ответ:</strong> {answer.answer}
                    </p>
                    {answer.customAnswer && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Свой вариант:</strong> {answer.customAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-muted/50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="mb-4 glass-card"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
            <h1 className="text-3xl font-bold gradient-text">
              Админ-панель опросов
            </h1>
            <p className="text-muted-foreground mt-2">
              Управление и анализ результатов опросов сотрудников
            </p>
          </div>
          <Button onClick={exportToCSV} className="glass-card">
            <Download className="mr-2 h-4 w-4" />
            Экспорт CSV
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего ответов</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Отделы</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold gradient-text">{Object.keys(stats.byDepartment).length}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Последний ответ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {responses.length > 0 
                  ? new Date(responses[0].completed_at).toLocaleDateString('ru-RU')
                  : 'Нет данных'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Результаты опросов</CardTitle>
            <CardDescription>
              Список всех завершенных опросов
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Пока нет завершенных опросов
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Дата завершения</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <Badge className={getDepartmentColor(response.department)}>
                          {getDepartmentName(response.department)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPositionName(response.position)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(response.completed_at).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResponse(response)}
                        >
                          Посмотреть ответы
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}