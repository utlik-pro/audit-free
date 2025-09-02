import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download, Users, BarChart3, Clock, Lock, Archive, Trash2, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
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
  archived?: boolean;
}

export default function Admin() {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<QuizResponse | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('adminAuthorized') === 'true';
    setAuthorized(isAuth);
    // Allow access via URL param ?pw=125690 (useful on mobile keyboards)
    if (!isAuth && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pw = params.get('pw');
      if (pw && pw.trim() === '125690') {
        localStorage.setItem('adminAuthorized', 'true');
        setAuthorized(true);
      }
    }
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
      
      // Проверяем, есть ли колонка archived в первой записи
      const hasArchivedColumn = data && data.length > 0 && 'archived' in data[0];
      
      // Используем localStorage только если колонки archived нет в БД
      const archivedIds = hasArchivedColumn 
        ? [] 
        : JSON.parse(localStorage.getItem('archivedResponses') || '[]');
      
      const normalized = (data || []).map((r: any) => ({
        ...r,
        answers: parseMaybeJson(r.answers) ?? [],
        questions: parseMaybeJson(r.questions) ?? [],
        // Используем значение из БД если оно есть, иначе проверяем localStorage
        archived: hasArchivedColumn ? (r.archived === true) : archivedIds.includes(r.id),
      }));
      
      // Если колонка archived существует в БД, очищаем localStorage
      if (hasArchivedColumn && archivedIds.length > 0) {
        localStorage.removeItem('archivedResponses');
      }
      
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

  const toggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      // Обновляем запись в БД
      const { error } = await supabase
        .from('quiz_responses')
        .update({ archived: !currentArchived })
        .eq('id', id);

      if (error) {
        // Если ошибка связана с отсутствием колонки (не должно происходить после миграции)
        if (error.message.includes('column') || error.code === '42703') {
          console.warn('Колонка archived не существует. Используем localStorage.');
          
          // Используем localStorage как запасной вариант
          const archivedIds = JSON.parse(localStorage.getItem('archivedResponses') || '[]');
          
          if (currentArchived) {
            const index = archivedIds.indexOf(id);
            if (index > -1) archivedIds.splice(index, 1);
          } else {
            archivedIds.push(id);
          }
          
          localStorage.setItem('archivedResponses', JSON.stringify(archivedIds));
          
          // Обновляем локальное состояние
          setResponses(responses.map(r => 
            r.id === id ? { ...r, archived: !currentArchived } : r
          ));
          
          toast({
            title: currentArchived ? "Разархивировано" : "Архивировано",
            description: "Архивирование работает локально. Примените миграцию в Supabase.",
            variant: "default",
          });
          return;
        }
        throw error;
      }
      
      // Обновляем локальное состояние при успешном обновлении в БД
      setResponses(responses.map(r => 
        r.id === id ? { ...r, archived: !currentArchived } : r
      ));
      
      toast({
        title: currentArchived ? "Разархивировано" : "Архивировано",
        description: currentArchived ? "Опрос восстановлен из архива" : "Опрос перемещен в архив",
      });
    } catch (error) {
      console.error('Error toggling archive:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус архивирования.",
        variant: "destructive",
      });
    }
  };

  const deleteResponse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Обновляем локальное состояние
      setResponses(responses.filter(r => r.id !== id));
      setDeleteConfirmId(null);
      
      toast({
        title: "Удалено",
        description: "Опрос успешно удален.",
      });
    } catch (error) {
      console.error('Error deleting response:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить опрос.",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    const visibleResponses = filteredResponses();
    if (selectedIds.size === visibleResponses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleResponses.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkArchive = async () => {
    const toArchive = Array.from(selectedIds);
    if (toArchive.length === 0) return;

    try {
      // Архивируем все выбранные записи
      for (const id of toArchive) {
        const response = responses.find(r => r.id === id);
        if (response) {
          await toggleArchive(id, response.archived || false);
        }
      }
      
      setSelectedIds(new Set());
      toast({
        title: "Операция завершена",
        description: `Обработано ${toArchive.length} записей.`,
      });
    } catch (error) {
      console.error('Error bulk archiving:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обработать некоторые записи.",
        variant: "destructive",
      });
    }
  };

  const bulkDelete = async () => {
    const toDelete = Array.from(selectedIds);
    if (toDelete.length === 0) return;

    try {
      // Удаляем все выбранные записи
      for (const id of toDelete) {
        const { error } = await supabase
          .from('quiz_responses')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      // Обновляем локальное состояние
      setResponses(responses.filter(r => !toDelete.includes(r.id)));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      
      toast({
        title: "Удалено",
        description: `${toDelete.length} записей успешно удалено.`,
      });
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить некоторые записи.",
        variant: "destructive",
      });
    }
  };

  const filteredResponses = () => {
    return responses.filter(r => showArchived ? r.archived : !r.archived);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Отдел', 'Позиция', 'Дата завершения', 'Вопросы и ответы'];
    const csvData = responses.map((response: any) => {
      const answersArr = Array.isArray(response.answers)
        ? response.answers
        : (typeof response.answers === 'string' ? parseMaybeJson(response.answers) : []);
      const answersText = (answersArr || []).map((answer: any, index: number) => {
        // Обрабатываем как старый формат (один ответ), так и новый (массив ответов)
        if (answer.answers && Array.isArray(answer.answers)) {
          // Новый формат с множественными ответами
          const answersStr = answer.answers.join(', ');
          const customStr = answer.customAnswers && answer.customAnswers.length > 0 
            ? ` (Свой: ${answer.customAnswers.join(', ')})` 
            : '';
          return `Q${index + 1}: ${answer.questionText}\nA: ${answersStr}${customStr}`;
        } else {
          // Старый формат с одним ответом
          return `Q${index + 1}: ${answer.questionText}\nA: ${answer.answer}${answer.customAnswer ? ` (${answer.customAnswer})` : ''}`;
        }
      }).join('\n---\n');
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
    // Прямое соответствие теперь
    if (position === 'Руководитель' || position === 'Сотрудник') {
      return position;
    }
    // Для обратной совместимости со старыми данными
    const names: Record<string, string> = {
      'top': 'Руководитель',
      'middle': 'Сотрудник',
      'junior': 'Сотрудник'
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
                if (password.trim() === '125690') {
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
                    {answer.answers && Array.isArray(answer.answers) ? (
                      // Новый формат с множественными ответами
                      <>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Ответы:</strong> {answer.answers.join(', ')}
                        </p>
                        {answer.customAnswers && answer.customAnswers.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Свой вариант:</strong> {answer.customAnswers.join(', ')}
                          </p>
                        )}
                      </>
                    ) : (
                      // Старый формат с одним ответом (для обратной совместимости)
                      <>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Ответ:</strong> {answer.answer}
                        </p>
                        {answer.customAnswer && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Свой вариант:</strong> {answer.customAnswer}
                          </p>
                        )}
                      </>
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
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowArchived(!showArchived)} 
              variant="outline"
              className="glass-card"
            >
              {showArchived ? (
                <><Eye className="mr-2 h-4 w-4" /> Показать активные</>
              ) : (
                <><Archive className="mr-2 h-4 w-4" /> Показать архив</>
              )}
            </Button>
            <Button onClick={exportToCSV} className="glass-card">
              <Download className="mr-2 h-4 w-4" />
              Экспорт CSV
            </Button>
          </div>
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
            <CardTitle>
              {showArchived ? 'Архив опросов' : 'Результаты опросов'}
            </CardTitle>
            <CardDescription>
              {showArchived 
                ? `Архивные опросы (${filteredResponses().length})`
                : `Активные опросы (${filteredResponses().length})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-4 mb-4 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium">
                  Выбрано: {selectedIds.size} записей
                </div>
                <div className="flex gap-2">
                  {!showArchived && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={bulkArchive}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Архивировать выбранные
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить выбранные
                  </Button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredResponses().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {showArchived 
                  ? 'Нет архивных опросов' 
                  : 'Нет активных опросов'
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={toggleSelectAll}
                      >
                        {selectedIds.size === filteredResponses().length && filteredResponses().length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Дата завершения</TableHead>
                    <TableHead></TableHead>
                    <TableHead className="w-[100px] text-center">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses().map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleSelect(response.id)}
                        >
                          {selectedIds.has(response.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            onClick={() => toggleArchive(response.id, response.archived || false)}
                            title={response.archived ? "Разархивировать" : "Архивировать"}
                          >
                            {response.archived ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                            onClick={() => setDeleteConfirmId(response.id)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие невозможно отменить. Опрос будет удален навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && deleteResponse(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить выбранные записи?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь удалить {selectedIds.size} записей. Это действие невозможно отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBulkDeleteConfirm(false)}>
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={bulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить все выбранные
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}