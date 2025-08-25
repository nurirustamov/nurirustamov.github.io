import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';

// --- Хуки и утилиты ---
import { useLocalStorage } from './hooks/useLocalStorage';

// --- UI Компоненты ---
import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';
import WavingCat from './components/WavingCat';
import Button from './components/ui/Button';
import { ChartBarIcon } from './assets/icons';

// --- Страницы ---
import QuizListPage from './pages/QuizListPage';
import QuizEditorPage from './pages/QuizEditorPage';
import TakeQuizPage from './pages/TakeQuizPage';
import QuizResultPage from './pages/QuizResultPage';
import QuizReviewPage from './pages/QuizReviewPage';
import StatisticsPage from './pages/StatisticsPage';

const ADMIN_PASSWORD = 'sn200924'; // Пароль для защищенных действий

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
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ad</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="İvan" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Soyad</label>
                    <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="İvanov" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={handleConfirm}>Testə başla</Button>
            </div>
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
                <div>
                    <label className="block text-sm font-medium text-gray-700">Parol</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" placeholder="Parolu daxil edin" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={handleConfirm}>Təsdiqlə</Button>
            </div>
        </Modal>
    );
};

// --- Главный компонент приложения ---
export default function App() {
    const [quizzes, setQuizzes] = useLocalStorage('eduventure-quizzes-v5-az', []);
    const [user, setUser] = useLocalStorage('eduventure-user-az', { name: '', surname: '' });
    const [quizResults, setQuizResults] = useLocalStorage('eduventure-results-v2-az', []);
    
    const [lastResult, setLastResult] = useState({ score: 0, total: 0, userAnswers: {}, questionOrder: [] });
    const [toast, setToast] = useState({ message: '', isVisible: false });
    
    const [quizToStartId, setQuizToStartId] = useState(null);
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, quizIdToDelete: null });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [protectedAction, setProtectedAction] = useState(null);

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
        setProtectedAction(action);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = () => {
        if (!protectedAction) return;
        const { type, payload } = protectedAction;
        switch (type) {
            case 'add':
                const newQuiz = { id: Date.now(), title: 'Yeni Test', description: '', category: 'Kateqoriyasız', timeLimit: 10, questions: [], shuffleQuestions: false, shuffleOptions: false };
                setQuizzes(prevQuizzes => [...prevQuizzes, newQuiz]);
                navigate(`/quiz/${newQuiz.id}/edit`);
                break;
            case 'edit':
                navigate(`/quiz/${payload}/edit`);
                break;
            case 'delete':
                setDeleteModal({ isOpen: true, quizIdToDelete: payload });
                break;
            case 'clone':
                const originalQuiz = quizzes.find(q => q.id === payload);
                if (originalQuiz) {
                    const clonedQuiz = {
                        ...originalQuiz,
                        id: Date.now(),
                        title: `${originalQuiz.title} (kopiya)`,
                        questions: originalQuiz.questions.map(q => ({ ...q, id: Date.now() + Math.random() }))
                    };
                    setQuizzes(prevQuizzes => [...prevQuizzes, clonedQuiz]);
                    navigate(`/quiz/${clonedQuiz.id}/edit`);
                }
                break;
            default: break;
        }
        setProtectedAction(null);
    };

    const handleAddNewQuizRequest = () => requestProtectedAction({ type: 'add' });
    const handleEditQuizRequest = (quizId) => requestProtectedAction({ type: 'edit', payload: quizId });
    const handleDeleteQuizRequest = (quizId) => requestProtectedAction({ type: 'delete', payload: quizId });
    const handleCloneQuizRequest = (quizId) => requestProtectedAction({ type: 'clone', payload: quizId });

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
        setIsUserInfoModalOpen(true);
    };

    const handleConfirmUserInfo = (name, surname) => {
        setUser({ name, surname });
        setIsUserInfoModalOpen(false);
        navigate(`/quiz/${quizToStartId}/take`);
    };

    const handleSubmitQuiz = (quizId, answers, questionsInOrder) => {
        const quiz = quizzes.find(q => q.id === quizId);
        let score = 0;
        questionsInOrder.forEach(q => {
            const userAnswer = answers[q.id];
            if (userAnswer === undefined) return;
            let isCorrect = false;
            if (q.type === 'single') isCorrect = userAnswer === q.options[q.correctAnswers[0]];
            else if (q.type === 'multiple') { const correct = q.correctAnswers.map(i => q.options[i]).sort(); const user = userAnswer ? [...userAnswer].sort() : []; isCorrect = JSON.stringify(correct) === JSON.stringify(user); }
            else if (q.type === 'textInput') isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswers[0].trim().toLowerCase();
            else if (q.type === 'trueFalse') isCorrect = userAnswer === q.correctAnswer;
            else if (q.type === 'ordering') isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.orderItems);
            if (isCorrect) score++;
        });

        const newResult = {
            id: Date.now(),
            userName: user.name, userSurname: user.surname,
            quizTitle: quiz.title, quizId: quiz.id,
            score, total: quiz.questions.length,
            percentage: quiz.questions.length > 0 ? Math.round((score / quiz.questions.length) * 100) : 0,
            date: new Date().toISOString(),
            userAnswers: answers, questionOrder: questionsInOrder,
        };
        setQuizResults(prevResults => [...prevResults, newResult]);
        setLastResult({ score, total: quiz.questions.length, userAnswers: answers, questionOrder: questionsInOrder });
        navigate(`/quiz/${quizId}/result`);
    };

    const QuizListPageWrapper = () => <QuizListPage quizzes={quizzes} onStartQuiz={handleStartQuizRequest} onAddNewQuiz={handleAddNewQuizRequest} onEditQuiz={handleEditQuizRequest} onDeleteRequest={handleDeleteQuizRequest} onCloneQuiz={handleCloneQuizRequest} />;
    const StatisticsPageWrapper = () => <StatisticsPage results={quizResults} onBack={() => navigate('/')} quizzes={quizzes} />;
    
    const QuizPageWrapper = ({ pageType }) => {
        const { id } = useParams();
        const quiz = quizzes.find(q => q.id === Number(id));
        if (!quiz) return <div className="text-center text-red-500">Test tapılmadı!</div>;

        switch (pageType) {
            case 'edit': return <QuizEditorPage quiz={quiz} onSave={handleSaveQuiz} onBack={() => navigate('/')} showToast={showToast} existingCategories={existingCategories} />;
            case 'take': return <TakeQuizPage quiz={quiz} user={user} onSubmit={(answers, order) => handleSubmitQuiz(quiz.id, answers, order)} />;
            case 'result': return <QuizResultPage user={user} score={lastResult.score} total={lastResult.total} onBack={() => navigate('/')} onReview={() => navigate(`/quiz/${id}/review`)} />;
            case 'review': return <QuizReviewPage quiz={quiz} userAnswers={lastResult.userAnswers} questionOrder={lastResult.questionOrder} onBack={() => navigate(`/quiz/${id}/result`)} />;
            default: return navigate('/');
        }
    };

    return (
        <>
            <div className="bg-orange-50 min-h-screen font-sans text-gray-900">
                <header className="bg-white shadow-md sticky top-0 z-40">
                    <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
                        <Link to="/" className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">EduventureWithSeda</Link>
                        <Link to="/stats">
                            <Button as="span" variant="secondary">
                                <ChartBarIcon />
                                <span className="hidden sm:inline ml-2">Statistika</span>
                            </Button>
                        </Link>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-6 md:py-8">
                    <Routes>
                        <Route path="/" element={<QuizListPageWrapper />} />
                        <Route path="/stats" element={<StatisticsPageWrapper />} />
                        <Route path="/quiz/:id/edit" element={<QuizPageWrapper pageType="edit" />} />
                        <Route path="/quiz/:id/take" element={<QuizPageWrapper pageType="take" />} />
                        <Route path="/quiz/:id/result" element={<QuizPageWrapper pageType="result" />} />
                        <Route path="/quiz/:id/review" element={<QuizPageWrapper pageType="review" />} />
                    </Routes>
                </main>
                <footer className="text-center py-4 text-gray-500 text-sm"><p>&copy; {new Date().getFullYear()} EduventureWithSeda. Bütün hüquqlar qorunur.</p></footer>
            </div>
            
            <Toast message={toast.message} isVisible={toast.isVisible} />
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, quizIdToDelete: null })} onConfirm={confirmDelete} title="Silməni təsdiqləyin">
                <p>Bu testi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmazdır.</p>
            </Modal>
            <UserInfoModal isOpen={isUserInfoModalOpen} onClose={() => setIsUserInfoModalOpen(false)} onConfirm={handleConfirmUserInfo} showToast={showToast} />
            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onConfirm={handlePasswordConfirm} showToast={showToast} />
            <WavingCat />
        </>
    );
}
