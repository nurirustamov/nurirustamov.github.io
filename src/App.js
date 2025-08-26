import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, Link, useLocation, createSearchParams } from 'react-router-dom';
import Papa from 'papaparse';

// --- Хуки и утилиты ---
import { useLocalStorage } from './hooks/useLocalStorage';

// --- UI Компоненты ---
import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';
import WavingCat from './components/WavingCat';
import Button from './components/ui/Button';
import { ChartBarIcon, BookOpenIcon, PencilAltIcon, UploadIcon, LibraryIcon, PlusIcon } from './assets/icons';

// --- Страницы ---
import QuizListPage from './pages/QuizListPage';
import QuizEditorPage from './pages/QuizEditorPage';
import TakeQuizPage from './pages/TakeQuizPage';
import QuizResultPage from './pages/QuizResultPage';
import QuizReviewPage from './pages/QuizReviewPage';
import StatisticsPage from './pages/StatisticsPage';
import StudentReportPage from './pages/StudentReportPage';
import QuestionBankPage from './pages/QuestionBankPage';
import PastQuizReviewPage from './pages/PastQuizReviewPage';
import ManualReviewPage from './pages/ManualReviewPage';

const ADMIN_PASSWORD = 'sn200924';

// --- Модальные окна ---
const UserInfoModal = ({ isOpen, onClose, onConfirm, showToast }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const handleConfirm = () => {
        if (!name.trim() || !surname.trim()) {
            showToast('Zəhmət olmasa, ad və soyadınızı daxil edin.');
            return;
        }
        onConfirm(name, surname);
        onClose();
    };
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Məlumatlarınızı daxil edin">
            <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Ad</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="İvan" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Soyad</label><input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="İvanov" /></div>
            </div>
            <div className="mt-6 flex justify-end"><Button onClick={handleConfirm}>Testə başla</Button></div>
        </Modal>
    );
};

const PasswordModal = ({ isOpen, onClose, onConfirm, showToast }) => {
    const [password, setPassword] = useState('');
    const handleConfirm = () => {
        if (password === ADMIN_PASSWORD) {
            onConfirm();
            onClose();
            setPassword('');
        } else {
            showToast('Yanlış parol!');
        }
    };
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Girişə nəzarət">
            <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Parol</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="Parolu daxil edin" /></div>
            </div>
            <div className="mt-6 flex justify-end"><Button onClick={handleConfirm}>Təsdiqlə</Button></div>
        </Modal>
    );
};

const ModeSelectionModal = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rejimi seçin">
            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => onSelect('exam')} className="w-full flex-1"><PencilAltIcon /> İmtahan Rejimi</Button>
                <Button onClick={() => onSelect('practice')} variant="secondary" className="w-full flex-1"><BookOpenIcon /> Məşq Rejimi</Button>
            </div>
        </Modal>
    );
};

const ImportModal = ({ isOpen, onClose, onImport, showToast }) => {
    const [file, setFile] = useState(null);
    const handleFileChange = (e) => { if (e.target.files) { setFile(e.target.files[0]); } };
    const handleImport = () => {
        if (!file) {
            showToast('Zəhmət olmasa, fayl seçin.');
            return;
        }
        onImport(file);
        onClose();
    };
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sualları CSV-dən idxal et">
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Düzgün format üçün şablonu yükləyin. Sütun başlıqları dəyişdirilməməlidir: <strong>text, type, options, correctAnswers, explanation, points</strong></p>
                <a href="/questions_template.csv" download className="text-orange-600 hover:underline">Şablonu yüklə</a>
                <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
            </div>
            <div className="mt-6 flex justify-end"><Button onClick={handleImport}><UploadIcon /> İdxal et</Button></div>
        </Modal>
    );
};

const AddFromBankModal = ({ isOpen, onClose, onAdd, showToast, questionBank }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBank = useMemo(() => 
        questionBank.filter(q => q.text.toLowerCase().includes(searchTerm.toLowerCase()))
    , [questionBank, searchTerm]);

    const handleToggleSelection = (id) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const handleAdd = () => {
        if (selectedIds.size === 0) {
            showToast('Əlavə etmək üçün ən azı bir sual seçin.');
            return;
        }
        onAdd(Array.from(selectedIds));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bankdan sual əlavə et">
            <div className="space-y-4">
                <input type="text" placeholder="Sual axtar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {filteredBank.map(q => (
                        <div key={q.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                            <input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => handleToggleSelection(q.id)} className="h-4 w-4 text-orange-600 rounded mr-3" />
                            <label className="flex-1 cursor-pointer" onClick={() => handleToggleSelection(q.id)}>{q.text}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-6 flex justify-end"><Button onClick={handleAdd}><PlusIcon /> Seçilmişləri əlavə et</Button></div>
        </Modal>
    );
};

export default function App() {
    const [quizzes, setQuizzes] = useLocalStorage('eduventure-quizzes-v6-az', []);
    const [user, setUser] = useLocalStorage('eduventure-user-az', { name: '', surname: '' });
    const [quizResults, setQuizResults] = useLocalStorage('eduventure-results-v5-az', []);
    const [questionBank, setQuestionBank] = useLocalStorage('eduventure-question-bank-v1', []);
    
    const [lastResult, setLastResult] = useState(null);
    const [toast, setToast] = useState({ message: '', isVisible: false });
    
    const [quizToStartId, setQuizToStartId] = useState(null);
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [isModeSelectionModalOpen, setIsModeSelectionModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, quizIdToDelete: null });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [protectedAction, setProtectedAction] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [quizToImportInto, setQuizToImportInto] = useState(null);
    const [isAddFromBankModalOpen, setIsAddFromBankModalOpen] = useState(false);
    const [quizToAddTo, setQuizToAddTo] = useState(null);

    const navigate = useNavigate();

    const existingCategories = useMemo(() => {
        const categories = new Set(quizzes.map(q => q.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [quizzes]);

    const showToast = (message) => {
        setToast({ message, isVisible: true });
        setTimeout(() => setToast({ message: '', isVisible: false }), 3000);
    };

    const requestProtectedAction = (action) => {
        setProtectedAction(() => action);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = () => {
        if (!protectedAction) return;
        const { type, payload } = protectedAction;
        switch (type) {
            case 'add':
                const newQuiz = { id: Date.now(), title: 'Yeni Test', description: '', category: 'Kateqoriyasız', timeLimit: 10, questions: [], shuffleQuestions: false, shuffleOptions: false, isArchived: false };
                setQuizzes(prev => [...prev, newQuiz]);
                navigate(`/quiz/${newQuiz.id}/edit`);
                break;
            case 'edit': navigate(`/quiz/${payload}/edit`); break;
            case 'delete': setDeleteModal({ isOpen: true, quizIdToDelete: payload }); break;
            case 'clone':
                const originalQuiz = quizzes.find(q => q.id === payload);
                if (originalQuiz) {
                    const clonedQuiz = { ...originalQuiz, id: Date.now(), title: `${originalQuiz.title} (kopiya)`, questions: originalQuiz.questions.map(q => ({ ...q, id: Date.now() + Math.random() })) };
                    setQuizzes(prev => [...prev, clonedQuiz]);
                    navigate(`/quiz/${clonedQuiz.id}/edit`);
                }
                break;
            case 'archive':
                handleArchiveQuiz(payload.quizId, payload.isArchived);
                break;
            case 'question_bank': navigate('/question-bank'); break;
            default: break;
        }
        setProtectedAction(null);
    };

    const handleAddNewQuizRequest = () => requestProtectedAction({ type: 'add' });
    const handleEditQuizRequest = (quizId) => requestProtectedAction({ type: 'edit', payload: quizId });
    const handleDeleteQuizRequest = (quizId) => requestProtectedAction({ type: 'delete', payload: quizId });
    const handleCloneQuizRequest = (quizId) => requestProtectedAction({ type: 'clone', payload: quizId });
    const handleArchiveQuizRequest = (quizId, isArchived) => requestProtectedAction({ type: 'archive', payload: { quizId, isArchived } });
    const handleQuestionBankRequest = () => requestProtectedAction({ type: 'question_bank' });

    const handleSaveQuiz = (updatedQuiz) => {
        setQuizzes(quizzes.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
        navigate('/');
    };

    const confirmDelete = () => {
        setQuizzes(quizzes.filter(q => q.id !== deleteModal.quizIdToDelete));
        setDeleteModal({ isOpen: false, quizIdToDelete: null });
        showToast("Test silindi");
    };

    const handleStartQuizRequest = (quizId) => {
        setQuizToStartId(quizId);
        setIsModeSelectionModalOpen(true);
    };

    const handleModeSelected = (mode) => {
        setIsModeSelectionModalOpen(false);
        if (mode === 'exam') {
            setIsUserInfoModalOpen(true);
        } else {
            navigate(`/quiz/${quizToStartId}/practice`);
        }
    };

    const handleConfirmUserInfo = (name, surname) => {
        setUser({ name, surname });
        setIsUserInfoModalOpen(false);
        navigate(`/quiz/${quizToStartId}/take`);
    };

    const handleSubmitQuiz = (quizId, answers, questionsInOrder) => {
        const quiz = quizzes.find(q => q.id === quizId);
        let score = 0;
        let totalPoints = 0;
        let correctAnswersCount = 0;
        const hasOpenQuestions = questionsInOrder.some(q => q.type === 'open');

        questionsInOrder.forEach(q => {
            const userAnswer = answers[q.id];
            const questionPoints = q.points || 1;
            totalPoints += questionPoints;

            if (userAnswer === undefined) return;

            let isCorrect = false;
            if (q.type !== 'open') {
                if (q.type === 'single') isCorrect = userAnswer === q.options[q.correctAnswers[0]];
                else if (q.type === 'multiple') { const correct = q.correctAnswers.map(i => q.options[i]).sort(); const user = userAnswer ? [...userAnswer].sort() : []; isCorrect = JSON.stringify(correct) === JSON.stringify(user); }
                else if (q.type === 'textInput') isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswers[0].trim().toLowerCase();
                else if (q.type === 'trueFalse') isCorrect = userAnswer === q.correctAnswer;
                else if (q.type === 'ordering') isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.orderItems);
            }
            
            if (isCorrect) {
                score += questionPoints;
                correctAnswersCount++;
            }
        });

        const newResult = { 
            id: Date.now(), 
            userName: user.name, 
            userSurname: user.surname, 
            quizTitle: quiz.title, 
            quizId: quiz.id, 
            score,
            totalPoints,
            correctAnswersCount,
            totalQuestions: quiz.questions.length,
            percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0, 
            status: hasOpenQuestions ? 'pending_review' : 'completed',
            date: new Date().toISOString(), 
            userAnswers: answers, 
            questionOrder: questionsInOrder 
        };
        setQuizResults(prev => [...prev, newResult]);
        setLastResult(newResult);
        navigate(`/quiz/${quiz.id}/result`);
    };

    const handleImportRequest = (quizId) => {
        setQuizToImportInto(quizId);
        setIsImportModalOpen(true);
    };

    const handleImportQuestions = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const requiredHeaders = ['text', 'type', 'options', 'correctAnswers', 'explanation', 'points'];
                    if (!requiredHeaders.every(h => results.meta.fields.includes(h))) {
                        showToast('CSV faylında tələb olunan başlıqlar yoxdur.');
                        return;
                    }

                    const newQuestions = results.data.map(row => {
                        const options = row.options.split(';').map(o => o.trim());
                        let correctAnswers;
                        if (row.type === 'single' || row.type === 'multiple') {
                            correctAnswers = row.correctAnswers.split(';').map(ca => options.indexOf(ca.trim())).filter(i => i !== -1);
                        } else {
                            correctAnswers = [row.correctAnswers];
                        }

                        return {
                            id: Date.now() + Math.random(),
                            text: row.text,
                            type: row.type,
                            options,
                            correctAnswers,
                            explanation: row.explanation,
                            points: parseInt(row.points, 10) || 1,
                            correctAnswer: row.type === 'trueFalse' ? row.correctAnswers.toLowerCase() === 'true' : true,
                            orderItems: row.type === 'ordering' ? options : [],
                        };
                    });

                    setQuizzes(prevQuizzes => prevQuizzes.map(quiz => 
                        quiz.id === quizToImportInto 
                            ? { ...quiz, questions: [...quiz.questions, ...newQuestions] } 
                            : quiz
                    ));
                    showToast(`${newQuestions.length} sual uğurla idxal edildi!`);
                } catch (error) {
                    showToast('Faylın emalı zamanı xəta baş verdi.');
                    console.error(error);
                }
            }
        });
    };

    const handleAddFromBankRequest = (quizId) => {
        setQuizToAddTo(quizId);
        setIsAddFromBankModalOpen(true);
    };

    const handleAddQuestionsFromBank = (questionIds) => {
        const questionsToAdd = questionBank.filter(q => questionIds.includes(q.id));
        setQuizzes(prevQuizzes => prevQuizzes.map(quiz => 
            quiz.id === quizToAddTo
                ? { ...quiz, questions: [...quiz.questions, ...questionsToAdd.map(q => ({...q, id: Date.now() + Math.random()}))] } 
                : quiz
        ));
        showToast(`${questionsToAdd.length} sual bankdan əlavə edildi.`);
    };

    const handleUpdateResult = (updatedResult) => {
        setQuizResults(prevResults => prevResults.map(r => r.id === updatedResult.id ? updatedResult : r));
        navigate('/stats');
        showToast('Nəticə uğurla yeniləndi!');
    };

    const handleReviewRequest = (result) => {
        if (result.status === 'pending_review') {
            navigate(`/manual-review/${result.id}`);
        } else {
            navigate(`/review/${result.id}`);
        }
    };

    const handleArchiveQuiz = (quizId, isArchived) => {
        setQuizzes(prevQuizzes =>
            prevQuizzes.map(quiz =>
                quiz.id === quizId ? { ...quiz, isArchived } : quiz
            )
        );
        showToast(isArchived ? 'Test arxivlendi' : 'Test arxivdən çıxarıldı');
    };

    const QuizListPageWrapper = () => {
        const location = useLocation();
        const navigate = useNavigate();
        const queryParams = new URLSearchParams(location.search);
        const showArchived = queryParams.get('showArchived') === 'true';

        const handleSetShowArchived = (value) => {
            navigate({ search: createSearchParams({ showArchived: value }).toString() });
        };

        return <QuizListPage 
            quizzes={quizzes} 
            onStartQuiz={handleStartQuizRequest} 
            onAddNewQuiz={handleAddNewQuizRequest} 
            onEditQuiz={handleEditQuizRequest} 
            onDeleteRequest={handleDeleteQuizRequest} 
            onCloneQuiz={handleCloneQuizRequest} 
            onArchiveRequest={handleArchiveQuizRequest}
            showArchived={showArchived}
            setShowArchived={handleSetShowArchived}
        />;
    }
    const StatisticsPageWrapper = () => <StatisticsPage results={quizResults} onBack={() => navigate('/')} quizzes={quizzes} onReviewResult={handleReviewRequest} />;
    const StudentReportPageWrapper = () => <StudentReportPage results={quizResults} onReviewResult={handleReviewRequest} />;
    const QuestionBankPageWrapper = () => <QuestionBankPage questionBank={questionBank} setQuestionBank={setQuestionBank} />;
    
    const PastQuizReviewPageWrapper = () => {
        const { resultId } = useParams();
        const result = quizResults.find(r => r.id === Number(resultId));
        if (!result) return <div className="text-center text-red-500">Nəticə tapılmadı!</div>;
        const quiz = quizzes.find(q => q.id === result.quizId);
        if (!quiz) return <div className="text-center text-red-500">Test tapılmadı!</div>;
        return <PastQuizReviewPage result={result} quiz={quiz} />;
    };

    const ManualReviewPageWrapper = () => {
        return <ManualReviewPage results={quizResults} quizzes={quizzes} onUpdateResult={handleUpdateResult} />;
    };

    const QuizPageWrapper = ({ pageType }) => {
        const { id } = useParams();
        const quiz = quizzes.find(q => q.id === Number(id));
        if (!quiz) return <div className="text-center text-red-500">Test tapılmadı!</div>;

        switch (pageType) {
            case 'edit': return <QuizEditorPage quiz={quiz} onSave={handleSaveQuiz} onBack={() => navigate('/')} showToast={showToast} existingCategories={existingCategories} onImportRequest={() => handleImportRequest(quiz.id)} onAddFromBankRequest={() => handleAddFromBankRequest(quiz.id)} />;
            case 'take': return <TakeQuizPage quiz={quiz} user={user} onSubmit={(answers, order) => handleSubmitQuiz(quiz.id, answers, order)} mode="exam" />;
            case 'practice': return <TakeQuizPage quiz={quiz} user={{ name: 'Tələbə', surname: '' }} mode="practice" />;
            case 'result': return <QuizResultPage lastResult={lastResult} allResultsForThisQuiz={quizResults.filter(r => r.quizId === quiz.id)} onBack={() => navigate('/')} onReview={() => navigate(`/quiz/${id}/review`)} />;
            case 'review': return <QuizReviewPage quiz={quiz} userAnswers={lastResult.userAnswers} questionOrder={lastResult.questionOrder} onBack={() => navigate(-1)} />;
            default: return navigate('/');
        }
    };

    return (
        <>
            <div className="bg-orange-50 min-h-screen font-sans text-gray-900">
                <header className="bg-white shadow-md sticky top-0 z-40">
                    <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
                        <Link to="/" className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">EduventureWithSeda</Link>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleQuestionBankRequest} variant="secondary"><LibraryIcon /><span className="hidden sm:inline ml-2">Suallar Bankı</span></Button>
                            <Link to="/stats"><Button as="span" variant="secondary"><ChartBarIcon /><span className="hidden sm:inline ml-2">Statistika</span></Button></Link>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-6 md:py-8">
                    <Routes>
                        <Route path="/" element={<QuizListPageWrapper />} />
                        <Route path="/stats" element={<StatisticsPageWrapper />} />
                        <Route path="/student/:studentSlug" element={<StudentReportPageWrapper />} />
                        <Route path="/question-bank" element={<QuestionBankPageWrapper />} />
                        <Route path="/review/:resultId" element={<PastQuizReviewPageWrapper />} />
                        <Route path="/manual-review/:resultId" element={<ManualReviewPageWrapper />} />
                        <Route path="/quiz/:id/edit" element={<QuizPageWrapper pageType="edit" />} />
                        <Route path="/quiz/:id/take" element={<QuizPageWrapper pageType="take" />} />
                        <Route path="/quiz/:id/practice" element={<QuizPageWrapper pageType="practice" />} />
                        <Route path="/quiz/:id/result" element={<QuizPageWrapper pageType="result" />} />
                        <Route path="/quiz/:id/review" element={<QuizPageWrapper pageType="review" />} />
                    </Routes>
                </main>
                <footer className="text-center py-4 text-gray-500 text-sm"><p>&copy; {new Date().getFullYear()} EduventureWithSeda. Bütün hüquqlar qorunur.</p></footer>
            </div>
            
            <Toast message={toast.message} isVisible={toast.isVisible} />
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, quizIdToDelete: null })} onConfirm={confirmDelete} title="Silməni təsdiqləyin"><p>Bu testi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmazdır.</p></Modal>
            <UserInfoModal isOpen={isUserInfoModalOpen} onClose={() => setIsUserInfoModalOpen(false)} onConfirm={handleConfirmUserInfo} showToast={showToast} />
            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onConfirm={handlePasswordConfirm} showToast={showToast} />
            <ModeSelectionModal isOpen={isModeSelectionModalOpen} onClose={() => setIsModeSelectionModalOpen(false)} onSelect={handleModeSelected} />
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportQuestions} showToast={showToast} />
            <AddFromBankModal isOpen={isAddFromBankModalOpen} onClose={() => setIsAddFromBankModalOpen(false)} onAdd={handleAddQuestionsFromBank} showToast={showToast} questionBank={questionBank} />
            <WavingCat />
        </>
    );
}
