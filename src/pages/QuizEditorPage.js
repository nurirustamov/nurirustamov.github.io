import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import QuestionEditor from '../components/QuestionEditor';
import ComboBox from '../components/ui/ComboBox';
import { ArrowLeftIcon, PlusIcon, CheckIcon, UploadIcon, LibraryIcon } from '../assets/icons';

const QuizEditorPage = ({ quiz, onSave, onBack, showToast, existingCategories = [], onImportRequest, onAddFromBankRequest }) => {
    const [localQuiz, setLocalQuiz] = useState({ ...quiz, questions: quiz?.questions || [] });

    useEffect(() => {
        setLocalQuiz({ ...quiz, questions: quiz?.questions || [] });
    }, [quiz]);

    const handleQuizInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;
        if (type === 'datetime-local') {
            finalValue = value ? new Date(value).toISOString() : null;
        }
        if (name === 'attempt_limit' && value === '0') {
            finalValue = null;
        }
        setLocalQuiz(prev => ({ ...prev, [name]: finalValue }));
    };

    const addQuestion = () => {
        const newQuestion = { 
            id: Date.now(), 
            text: '', 
            type: 'single', 
            options: ['', ''], 
            correctAnswers: [], 
            correctAnswer: true, 
            orderItems: ['', ''],
            imageUrl: '',
            explanation: '',
            points: 1
        };
        setLocalQuiz(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    };

    const updateQuestion = (updatedQuestion) => setLocalQuiz(prev => ({ ...prev, questions: prev.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q) }));
    const deleteQuestion = (questionId) => setLocalQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== questionId) }));
    
    const handleDuplicateQuestion = (questionId) => {
        const questionToClone = localQuiz.questions.find(q => q.id === questionId);
        if (!questionToClone) return;

        const clonedQuestion = { ...questionToClone, id: Date.now() + Math.random() };
        const originalIndex = localQuiz.questions.findIndex(q => q.id === questionId);
        const newQuestions = [...localQuiz.questions];
        newQuestions.splice(originalIndex + 1, 0, clonedQuestion);
        setLocalQuiz(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSave = () => {
        if (!localQuiz.title || !localQuiz.title.trim()) {
            showToast("Testin adı boş ola bilməz!");
            return;
        }
        if (!localQuiz.category || !localQuiz.category.trim()) {
            showToast("Kateqoriya boş ola bilməz!");
            return;
        }
        onSave(localQuiz);
    };

    const formatDateTimeForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    if (!localQuiz) {
        return <div>Yüklənir...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <Button onClick={onBack} variant="secondary" className="mb-2 sm:mb-0"><ArrowLeftIcon /><span className="hidden sm:inline">Siyahıya qayıt</span></Button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">Test Redaktoru</h1>
                </div>
                <div className="w-full sm:w-auto">
                    <Button onClick={handleSave} className="w-full"><CheckIcon />Testi yadda saxla</Button>
                </div>
            </div>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Əsas Məlumatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4 col-span-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Testin adı</label>
                            <input type="text" name="title" value={localQuiz.title || ''} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                            <textarea name="description" value={localQuiz.description || ''} onChange={handleQuizInfoChange} rows="5" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                        </div>
                    </div>
                    <div className="space-y-4 col-span-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kateqoriya</label>
                            <ComboBox options={existingCategories} value={localQuiz.category || ''} onChange={(value) => setLocalQuiz(prev => ({ ...prev, category: value }))} placeholder="Kateqoriyanı seçin və ya yazın..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test üçün vaxt (dəqiqə)</label>
                            <input type="number" name="timeLimit" value={localQuiz.timeLimit || 10} onChange={handleQuizInfoChange} min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                         <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Parametrlər</h4>
                            <div className="space-y-3 pt-2 border-t">
                                <label className="flex items-center cursor-pointer"><input type="checkbox" name="shuffleQuestions" checked={!!localQuiz.shuffleQuestions} onChange={handleQuizInfoChange} className="h-4 w-4 text-orange-600 rounded border-gray-300" /> <span className="ml-2 text-sm text-gray-700">Sualları qarışdır</span></label>
                                <label className="flex items-center cursor-pointer"><input type="checkbox" name="shuffleOptions" checked={!!localQuiz.shuffleOptions} onChange={handleQuizInfoChange} className="h-4 w-4 text-orange-600 rounded border-gray-300" /> <span className="ml-2 text-sm text-gray-700">Variantları qarışdır</span></label>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Giriş Parametrləri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Testin başlama vaxtı</label>
                        <input type="datetime-local" name="start_time" value={formatDateTimeForInput(localQuiz.start_time)} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Testin bitmə vaxtı</label>
                        <input type="datetime-local" name="end_time" value={formatDateTimeForInput(localQuiz.end_time)} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cəhd limiti (0 = limitsiz)</label>
                        <input type="number" name="attempt_limit" value={localQuiz.attempt_limit || 0} onChange={handleQuizInfoChange} min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Kodu (Könüllü)</label>
                        <input type="text" name="passcode" value={localQuiz.passcode || ''} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Testə başlamaq üçün kod təyin et" />
                    </div>
                </div>
            </Card>

            <div>
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Suallar</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={onAddFromBankRequest} variant="secondary"><LibraryIcon />Bankdan əlavə et</Button>
                        <Button onClick={onImportRequest} variant="secondary"><UploadIcon />CSV-dən idxal et</Button>
                        <Button onClick={addQuestion}><PlusIcon />Sual əlavə et</Button>
                    </div>
                </div>
                <div className="space-y-4">
                    {localQuiz.questions.map((q, index) => <QuestionEditor key={q.id} question={q} index={index} onUpdate={updateQuestion} onDelete={() => deleteQuestion(q.id)} onDuplicate={() => handleDuplicateQuestion(q.id)} />)}
                </div>
                 {localQuiz.questions.length === 0 && (
                    <Card className="text-center py-12 border-dashed border-2 border-gray-300">
                        <p className="text-gray-500">Hələ heç bir sual əlavə edilməyib.</p>
                        <Button onClick={addQuestion} className="mt-4"><PlusIcon />İlk sualı əlavə et</Button>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default QuizEditorPage;