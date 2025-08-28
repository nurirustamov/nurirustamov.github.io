import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ComboBox from '../components/ui/ComboBox';
import QuestionEditor from '../components/QuestionEditor'; // Assuming this component exists and works as before
import { ArrowLeftIcon, PlusIcon, CheckIcon, UploadIcon, LibraryIcon, LockClosedIcon, DocumentTextIcon, PencilAltIcon, ClockIcon } from '../assets/icons';

const QuizEditorPage = ({ quiz, onSave, onBack, showToast, existingCategories = [], onImportRequest, onAddFromBankRequest, onDraftChange }) => {

    const handleQuizInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;
        if (type === 'datetime-local') {
            finalValue = value ? new Date(value).toISOString() : null;
        }
        onDraftChange({ ...quiz, [name]: finalValue });
    };

    const handleCategoryChange = (value) => {
        onDraftChange({ ...quiz, category: value });
    };

    const handleQuestionsChange = (newQuestions) => {
        onDraftChange({ ...quiz, questions: newQuestions });
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
        handleQuestionsChange([...quiz.questions, newQuestion]);
    };

    const updateQuestion = (updatedQuestion) => {
        handleQuestionsChange(quiz.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
    };

    const deleteQuestion = (questionId) => {
        handleQuestionsChange(quiz.questions.filter(q => q.id !== questionId));
    };

    const handleDuplicateQuestion = (questionId) => {
        const questionToClone = quiz.questions.find(q => q.id === questionId);
        if (!questionToClone) return;

        const clonedQuestion = { ...questionToClone, id: Date.now() + Math.random() };
        const originalIndex = quiz.questions.findIndex(q => q.id === questionId);
        const newQuestions = [...quiz.questions];
        newQuestions.splice(originalIndex + 1, 0, clonedQuestion);
        handleQuestionsChange(newQuestions);
    };

    const handleSave = () => {
        if (!quiz.title || !quiz.title.trim()) {
            showToast("Testin adı boş ola bilməz!");
            return;
        }
        if (!quiz.category || !quiz.category.trim()) {
            showToast("Kateqoriya boş ola bilməz!");
            return;
        }
        onSave(quiz);
    };

    const formatDateTimeForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    if (!quiz) {
        return <div>Yüklənir...</div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* --- Left Column: Settings Panel --- */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Test Redaktoru</h1>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={onBack} variant="secondary" className="w-full justify-center"><ArrowLeftIcon /> Siyahıya qayıt</Button>
                            <Button onClick={handleSave} className="w-full justify-center"><CheckIcon />Testi yadda saxla</Button>
                        </div>
                    </div>

                    <Card>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><DocumentTextIcon /> Əsas Məlumatlar</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Testin adı</label>
                                <input type="text" name="title" value={quiz.title || ''} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kateqoriya</label>
                                <ComboBox options={existingCategories} value={quiz.category || ''} onChange={handleCategoryChange} placeholder="Kateqoriyanı seçin və ya yazın..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                                <textarea name="description" value={quiz.description || ''} onChange={handleQuizInfoChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><PencilAltIcon /> Parametrlər</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test üçün vaxt (dəqiqə)</label>
                                <input type="number" name="timeLimit" value={quiz.timeLimit || 10} onChange={handleQuizInfoChange} min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div className="space-y-3 pt-2 border-t">
                                <label className="flex items-center cursor-pointer"><input type="checkbox" name="shuffleQuestions" checked={!!quiz.shuffleQuestions} onChange={handleQuizInfoChange} className="h-4 w-4 text-orange-600 rounded border-gray-300" /> <span className="ml-2 text-sm text-gray-700">Sualları qarışdır</span></label>
                                <label className="flex items-center cursor-pointer"><input type="checkbox" name="shuffleOptions" checked={!!quiz.shuffleOptions} onChange={handleQuizInfoChange} className="h-4 w-4 text-orange-600 rounded border-gray-300" /> <span className="ml-2 text-sm text-gray-700">Variantları qarışdır</span></label>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><ClockIcon /> Qabaqcıl Tənzimləmələr</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Başlama vaxtı (Könüllü)</label>
                                <input type="datetime-local" name="start_time" value={formatDateTimeForInput(quiz.start_time)} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bitmə vaxtı (Könüllü)</label>
                                <input type="datetime-local" name="end_time" value={formatDateTimeForInput(quiz.end_time)} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cəhd limiti (0 = limitsiz)</label>
                                <input type="number" name="attempt_limit" value={quiz.attempt_limit || 0} onChange={handleQuizInfoChange} min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giriş Kodu (Könüllü)</label>
                                <input type="text" name="passcode" value={quiz.passcode || ''} onChange={handleQuizInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Test üçün parol təyin et" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- Right Column: Questions --- */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Suallar ({quiz.questions.length})</h2>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={onAddFromBankRequest} variant="secondary"><LibraryIcon />Bankdan əlavə et</Button>
                                <Button onClick={onImportRequest} variant="secondary"><UploadIcon />CSV-dən idxal et</Button>
                                <Button onClick={addQuestion}><PlusIcon />{quiz.questions.length === 0 ? 'İlk sualı əlavə et' : 'Sual əlavə et'}</Button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {quiz.questions.map((q, index) => <QuestionEditor key={q.id} question={q} index={index} onUpdate={updateQuestion} onDelete={() => deleteQuestion(q.id)} onDuplicate={() => handleDuplicateQuestion(q.id)} />)}
                        </div>
                        {quiz.questions.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500">Hələ heç bir sual əlavə edilməyib. Yuxarıdakı düymələrdən istifadə edərək sual əlavə edin.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuizEditorPage;