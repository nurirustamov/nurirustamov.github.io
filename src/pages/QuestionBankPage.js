import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import QuestionEditor from '../components/QuestionEditor';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../assets/icons';

const QuestionBankPage = ({ questionBank, onSave, onDelete, showToast }) => {
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [questionToEdit, setQuestionToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddNewQuestion = () => {
        const newQuestion = {
            // ID будет присвоен базой данных, его отсутствие - признак нового вопроса
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
        setQuestionToEdit(newQuestion);
        setIsEditorModalOpen(true);
    };

    const handleEditQuestion = (question) => {
        setQuestionToEdit(question);
        setIsEditorModalOpen(true);
    };

    const handleSaveQuestion = (question) => {
        if (!question.text.trim()) {
            showToast("Sualın mətni boş ola bilməz!");
            return;
        }
        onSave(question); // Вызываем функцию из App.js, которая работает с Supabase
        setIsEditorModalOpen(false);
        setQuestionToEdit(null);
    };

    const handleDeleteWithConfirmation = (questionId) => {
        if (window.confirm("Bu sualı bankdan silmək istədiyinizə əminsiniz?")) {
            onDelete(questionId); // Вызываем функцию из App.js
        }
    };

    const filteredQuestions = useMemo(() => {
        return questionBank.filter(q => 
            q.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [questionBank, searchTerm]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Suallar Bankı</h1>
                <Button onClick={handleAddNewQuestion}><PlusIcon /> Yeni Sual Yarat</Button>
            </div>

            <Card>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                    <input 
                        type="text" 
                        placeholder="Sualın mətninə görə axtarış..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg w-full focus:ring-orange-400 focus:border-orange-400 transition"
                    />
                </div>
            </Card>

            <div className="space-y-4">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question) => (
                        <Card key={question.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">{question.text}</p>
                                <p className="text-sm text-gray-500">Növ: {question.type} | Bal: {question.points || 1}</p>
                            </div>
                            <div className="flex gap-2 self-end sm:self-center">
                                <Button onClick={() => handleEditQuestion(question)} variant="secondary"><EditIcon /></Button>
                                <Button onClick={() => handleDeleteWithConfirmation(question.id)} variant="danger"><TrashIcon /></Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="text-center py-12">
                        <p className="text-gray-500">Bankda heç bir sual tapılmadı. İlk sualınızı yaradın!</p>
                    </Card>
                )}
            </div>

            {isEditorModalOpen && (
                <Modal isOpen={isEditorModalOpen} onClose={() => setIsEditorModalOpen(false)} title={questionToEdit?.id ? "Sualı Redaktə Et" : "Yeni Sual Yarat"}>
                    <QuestionEditor 
                        question={questionToEdit}
                        index={0} 
                        onUpdate={setQuestionToEdit} 
                        isBankEditor={true}
                    />
                    <div className="flex justify-end mt-6">
                        <Button onClick={() => handleSaveQuestion(questionToEdit)}>Yadda Saxla</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default QuestionBankPage;