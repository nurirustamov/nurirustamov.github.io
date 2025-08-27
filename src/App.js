import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link, useLocation, createSearchParams } from 'react-router-dom';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';

// --- UI Компоненты ---
import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';
import WavingCat from './components/WavingCat';
import Button from './components/ui/Button';
import { ChartBarIcon, BookOpenIcon, PencilAltIcon, UploadIcon, LibraryIcon, PlusIcon, LogoutIcon, TrophyIcon as LeaderboardIcon } from './assets/icons';

// --- Страницы ---
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
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
import LeaderboardPage from './pages/LeaderboardPage';

// --- Вспомогательные функции ---
const isAnswerCorrect = (question, userAnswer) => {
    if (userAnswer === undefined || userAnswer === null) return false;
    if (!question || !question.type) return false;

    switch (question.type) {
        case 'single': return userAnswer === question.options[question.correctAnswers[0]];
        case 'multiple':
            const correctOptions = question.correctAnswers.map(i => question.options[i]).sort();
            const userOptions = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
            return JSON.stringify(correctOptions) === JSON.stringify(userOptions);
        case 'textInput': return userAnswer.trim().toLowerCase() === question.correctAnswers[0].trim().toLowerCase();
        case 'trueFalse': return userAnswer === question.correctAnswer;
        case 'ordering': return JSON.stringify(userAnswer) === JSON.stringify(question.orderItems);
        default: return false;
    }
};

// --- Модальные окна ---
const PasscodeModal = ({ isOpen, onClose, onConfirm, showToast }) => {
    const [passcode, setPasscode] = useState('');
    const handleConfirm = () => {
        onConfirm(passcode);
    };
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Giriş Kodu Tələb Olunur">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Giriş Kodu</label>
                    <input type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Kodu daxil edin" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={handleConfirm}>Təsdiqlə</Button>
            </div>
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

// --- Компоненты-обертки для страниц (вынесены из App для стабильности) ---

const QuizListPageWrapper = ({ quizzes, onStartQuiz, onAddNewQuiz, onEditQuiz, onDeleteRequest, onCloneQuiz, onArchiveRequest, onStartSmartPractice, isAdmin }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const showArchived = queryParams.get('showArchived') === 'true';

    const handleSetShowArchived = (value) => {
        navigate({ search: createSearchParams({ showArchived: value }).toString() });
    };

    return <QuizListPage 
        quizzes={quizzes} 
        onStartQuiz={onStartQuiz} 
        onAddNewQuiz={onAddNewQuiz} 
        onEditQuiz={onEditQuiz} 
        onDeleteRequest={onDeleteRequest} 
        onCloneQuiz={onCloneQuiz} 
        onArchiveRequest={onArchiveRequest}
        onStartSmartPractice={onStartSmartPractice}
        showArchived={showArchived}
        setShowArchived={handleSetShowArchived}
        isAdmin={isAdmin}
    />;
};

const StatisticsPageWrapper = ({ results, quizzes, onReviewResult }) => {
    const navigate = useNavigate();
    return <StatisticsPage results={results} onBack={() => navigate('/')} quizzes={quizzes} onReviewResult={onReviewResult} />;
};

const StudentReportPageWrapper = ({ results, onReviewResult }) => {
    const navigate = useNavigate();
    return <StudentReportPage results={results} onBack={() => navigate('/stats')} onReviewResult={onReviewResult} />;
};

const QuestionBankPageWrapper = ({ questionBank, onSave, onDelete, showToast }) => (
    <QuestionBankPage questionBank={questionBank} onSave={onSave} onDelete={onDelete} showToast={showToast} />
);

const LeaderboardPageWrapper = ({ results }) => (
    <LeaderboardPage results={results} />
);

const PastQuizReviewPageWrapper = ({ quizResults, quizzes, profile, fetchComments, postComment, deleteComment }) => {
    const { resultId } = useParams();
    const result = quizResults.find(r => r.id === Number(resultId));
    if (!result) return <div className="text-center text-red-500">Nəticə tapılmadı!</div>;
    const quiz = quizzes.find(q => q.id === result.quizId);
    if (!quiz) return <div className="text-center text-red-500">Test tapılmadı!</div>;
    return <PastQuizReviewPage result={result} quiz={quiz} profile={profile} fetchComments={fetchComments} postComment={postComment} deleteComment={deleteComment} />;
};

const ManualReviewPageWrapper = ({ results, quizzes, onUpdateResult }) => (
    <ManualReviewPage results={results} quizzes={quizzes} onUpdateResult={onUpdateResult} />
);

const QuizPageWrapper = ({ 
    pageType, 
    editingQuizDraft, 
    customPracticeQuiz, 
    quizzes, 
    lastResult, 
    quizResults, 
    session, 
    profile, 
    existingCategories, 
    showToast, 
    handleSaveQuiz, 
    handleImportRequest, 
    handleAddFromBankRequest, 
    setEditingQuizDraft, 
    handleSubmitQuiz 
}) => {
    const { id } = useParams();
    const navigate = useNavigate();
    let quiz;

    if (pageType === 'edit') {
        quiz = editingQuizDraft;
    } else if (pageType === 'custom_practice') {
        quiz = customPracticeQuiz;
    } else {
        quiz = quizzes.find(q => q.id === Number(id));
    }

    if (!quiz) return <div className="text-center text-red-500">Yüklənir...</div>;

    switch (pageType) {
        case 'edit': 
            return <QuizEditorPage quiz={quiz} onSave={handleSaveQuiz} onBack={() => navigate('/')} showToast={showToast} existingCategories={existingCategories} onImportRequest={() => handleImportRequest(quiz.id)} onAddFromBankRequest={() => handleAddFromBankRequest(quiz.id)} onDraftChange={setEditingQuizDraft} />;
        case 'take': 
            return <TakeQuizPage quiz={quiz} user={profile} onSubmit={(answers, order) => handleSubmitQuiz(quiz.id, answers, order)} mode="exam" />;
        case 'practice': 
            return <TakeQuizPage quiz={quiz} user={{ username: 'Tələbə' }} mode="practice" />;
        case 'custom_practice': 
            return <TakeQuizPage quiz={quiz} user={profile} mode="practice" />;
        case 'result': 
            return <QuizResultPage lastResult={lastResult} allResultsForThisQuiz={quizResults.filter(r => r.quizId === quiz.id)} onBack={() => navigate('/')} onReview={() => navigate(`/quiz/${id}/review`)} />;
        case 'review': 
            const resultForReview = lastResult || quizResults.find(r => r.quizId === quiz.id && r.user_id === session.user.id);
            if (!resultForReview) return <div className="text-center text-red-500">Nəticə tapılmadı!</div>;
            return <QuizReviewPage quiz={quiz} userAnswers={resultForReview.userAnswers} questionOrder={resultForReview.questionOrder} onBack={() => navigate(-1)} profile={profile} />;
        default: 
            return navigate('/');
    }
};

export default function App() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [quizzes, setQuizzes] = useState([]);
    const [questionBank, setQuestionBank] = useState([]);
    const [quizResults, setQuizResults] = useState([]);
    const [customPracticeQuiz, setCustomPracticeQuiz] = useState(null);
    const [editingQuizDraft, setEditingQuizDraft] = useState(null);
    
    const [lastResult, setLastResult] = useState(null);
    const [toast, setToast] = useState({ message: '', isVisible: false });
    
    const [quizToStartId, setQuizToStartId] = useState(null);
    const [isModeSelectionModalOpen, setIsModeSelectionModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, quizIdToDelete: null });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [quizToImportInto, setQuizToImportInto] = useState(null);
    const [isAddFromBankModalOpen, setIsAddFromBankModalOpen] = useState(false);
    const [quizToAddTo, setQuizToAddTo] = useState(null);
    const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
    const [passcodeQuiz, setPasscodeQuiz] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setIsAuthLoading(false);
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (session?.user) {
                const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (profileError) {
                    showToast('Profil yüklənərkən xəta baş verdi.');
                } else {
                    setProfile(profileData);
                }

                const { data: quizzesData } = await supabase.from('quizzes').select('*').order('id', { ascending: false });
                setQuizzes(quizzesData || []);

                const { data: questionBankData } = await supabase.from('question_bank').select('*').order('created_at', { ascending: false });
                setQuestionBank(questionBankData || []);

                const { data: resultsData } = await supabase.from('quiz_results').select('*').order('created_at', { ascending: false });
                setQuizResults(resultsData || []);
            } else {
                setProfile(null);
                setQuizzes([]);
                setQuestionBank([]);
                setQuizResults([]);
            }
        };
        
        if (!isAuthLoading) {
            fetchUserData();
        }
    }, [session?.user?.id, isAuthLoading]);

    const existingCategories = useMemo(() => {
        const categories = new Set(quizzes.map(q => q.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [quizzes]);

    const showToast = (message) => {
        setToast({ message, isVisible: true });
        setTimeout(() => setToast({ message: '', isVisible: false }), 3000);
    };

    const checkAdmin = () => {
        if (profile?.role !== 'admin') {
            showToast('Bu əməliyyat üçün admin hüququ tələb olunur.');
            return false;
        }
        return true;
    };

    const handleAddNewQuizRequest = async () => {
        if (!checkAdmin()) return;
        const { data: newQuiz, error } = await supabase.from('quizzes').insert({ title: 'Yeni Test', questions: [] }).select().single();
        if (error) {
            showToast(`Test yaradılarkən xəta: ${error.message}`);
        } else if (newQuiz) {
            setQuizzes(prev => [newQuiz, ...prev]);
            setEditingQuizDraft(newQuiz); // Инициализируем черновик
            navigate(`/quiz/${newQuiz.id}/edit`);
            showToast('Yeni test uğurla yaradıldı!');
        }
    };

    const handleEditQuizRequest = (quizId) => {
        if (checkAdmin()) {
            const quizToEdit = quizzes.find(q => q.id === quizId);
            if (quizToEdit) {
                setEditingQuizDraft(quizToEdit); // Инициализируем черновик
                navigate(`/quiz/${quizId}/edit`);
            }
        }
    };

    const handleDeleteQuizRequest = (quizId) => {
        if (checkAdmin()) {
            setDeleteModal({ isOpen: true, quizIdToDelete: quizId });
        }
    };

    const handleCloneQuizRequest = async (quizId) => {
        if (!checkAdmin()) return;
        const { data: originalQuiz, error: fetchError } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
        if (fetchError || !originalQuiz) {
            showToast('Kopyalanacaq test tapılmadı.');
            return;
        }
        const { id, created_at, ...quizToClone } = originalQuiz;
        quizToClone.title = `${quizToClone.title} (kopiya)`;
        const { data: clonedQuiz, error: cloneError } = await supabase.from('quizzes').insert(quizToClone).select().single();
        if (cloneError) {
            showToast(`Test kopyalanarkən xəta: ${cloneError.message}`);
        } else if (clonedQuiz) {
            setQuizzes(prev => [clonedQuiz, ...prev]);
            setEditingQuizDraft(clonedQuiz);
            navigate(`/quiz/${clonedQuiz.id}/edit`);
            showToast('Test uğurla kopyalandı!');
        }
    };

    const handleArchiveQuizRequest = async (quizId, isArchived) => {
        if (!checkAdmin()) return;
        const { data: updatedQuiz, error } = await supabase.from('quizzes').update({ isArchived }).eq('id', quizId).select().single();
        if (error) {
            showToast(`Test arxivlənərkən xəta: ${error.message}`);
        } else if (updatedQuiz) {
            setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
            showToast(isArchived ? 'Test arxivə əlavə edildi.' : 'Test arxivdən çıxarıldı.');
        }
    };

    const handleQuestionBankRequest = () => {
        if (checkAdmin()) {
            navigate('/question-bank');
        }
    };

    const handleSaveQuiz = async (quizToSave) => {
        const { id, ...quizDataToUpdate } = quizToSave;
        const { data, error } = await supabase.from('quizzes').update(quizDataToUpdate).eq('id', id).select().single();
        if (error) {
            showToast(`Testi yeniləyərkən xəta: ${error.message}`);
        } else if (data) {
            setQuizzes(prevQuizzes => prevQuizzes.map(q => (q.id === data.id ? data : q)));
            setEditingQuizDraft(null); // Очищаем черновик после сохранения
            showToast("Test uğurla yeniləndi!");
            navigate('/');
        }
    };

    const confirmDelete = async () => {
        const quizId = deleteModal.quizIdToDelete;
        const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
        if (error) {
            showToast(`Testi silərkən xəta: ${error.message}`);
        } else {
            setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
            showToast("Test uğurla silindi!");
        }
        setDeleteModal({ isOpen: false, quizIdToDelete: null });
    };

    const handleSaveQuestionToBank = async (question) => {
        const { id, ...questionData } = question;
        if (id && typeof id === 'number') {
            const { data, error } = await supabase.from('question_bank').update(questionData).eq('id', id).select().single();
            if (error) {
                showToast(`Sualı yeniləyərkən xəta: ${error.message}`);
            } else {
                setQuestionBank(prev => prev.map(q => q.id === id ? data : q));
                showToast('Sual uğurla yeniləndi!');
            }
        } else {
            const { data, error } = await supabase.from('question_bank').insert(questionData).select().single();
            if (error) {
                showToast(`Sualı əlavə edərkən xəta: ${error.message}`);
            } else {
                setQuestionBank(prev => [data, ...prev]);
                showToast('Sual banka əlavə edildi!');
            }
        }
    };

    const handleDeleteQuestionFromBank = async (questionId) => {
        const { error } = await supabase.from('question_bank').delete().eq('id', questionId);
        if (error) {
            showToast(`Sualı silərkən xəta: ${error.message}`);
        } else {
            setQuestionBank(prev => prev.filter(q => q.id !== questionId));
            showToast('Sual bankdan silindi.');
        }
    };

    const handleStartQuizRequest = async (quizId) => {
        if (!session) {
            showToast('Testə başlamaq üçün daxil olun.');
            navigate('/auth');
            return;
        }

        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        if (quiz.attempt_limit > 0) {
            const { data, error } = await supabase
                .from('quiz_results')
                .select('id', { count: 'exact' })
                .eq('user_id', session.user.id)
                .eq('quizId', quizId);

            if (error) {
                showToast('Cəhdləri yoxlayarkən xəta baş verdi.');
                return;
            }

            if (data.length >= quiz.attempt_limit) {
                showToast('Siz bu test üçün bütün cəhdlərinizi istifadə etmisiniz.');
                return;
            }
        }

        if (quiz.passcode) {
            setPasscodeQuiz(quiz);
            setIsPasscodeModalOpen(true);
        } else {
            setQuizToStartId(quizId);
            setIsModeSelectionModalOpen(true);
        }
    };

    const handlePasscodeConfirm = (enteredPasscode) => {
        if (passcodeQuiz && enteredPasscode === passcodeQuiz.passcode) {
            setIsPasscodeModalOpen(false);
            setQuizToStartId(passcodeQuiz.id);
            setIsModeSelectionModalOpen(true);
        } else {
            showToast('Yanlış giriş kodu!');
        }
    };

    const handleStartSmartPractice = () => {
        if (!profile || !quizResults.length) {
            showToast("Ağıllı məşq üçün kifayət qədər data yoxdur.");
            return;
        }

        const userResults = quizResults.filter(r => r.user_id === profile.id);
        if (userResults.length === 0) {
            showToast("Siz hələ heç bir testi tamamlamamısınız.");
            return;
        }

        const incorrectQuestions = new Map();

        userResults.forEach(result => {
            const quiz = quizzes.find(q => q.id === result.quizId);
            if (!quiz) return;

            result.questionOrder.forEach(q_ordered => {
                const originalQuestion = (quiz.questions || []).find(q => q.id === q_ordered.id);
                if (originalQuestion && !isAnswerCorrect(originalQuestion, result.userAnswers[originalQuestion.id])) {
                    incorrectQuestions.set(originalQuestion.id, originalQuestion);
                }
            });
        });

        const questionsForPractice = Array.from(incorrectQuestions.values()).slice(0, 30);

        if (questionsForPractice.length === 0) {
            showToast("Təbrik edirik! Səhv cavabınız yoxdur.");
            return;
        }

        const smartQuiz = {
            id: `smart-practice-${Date.now()}`,
            title: `Ağıllı Məşq (Səhvləriniz)`,
            questions: questionsForPractice,
            isSmart: true,
        };

        setCustomPracticeQuiz(smartQuiz);
        navigate("/practice/custom");
    };

    const handleModeSelected = (mode) => {
        setIsModeSelectionModalOpen(false);
        if (mode === 'exam') {
            navigate(`/quiz/${quizToStartId}/take`);
        } else {
            navigate(`/quiz/${quizToStartId}/practice`);
        }
    };

    const handleSubmitQuiz = async (quizId, answers, questionsInOrder) => {
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
                else if (q.type === 'multiple') { const correct = q.correctAnswers.map(i => q.options[i]).sort(); const userAns = userAnswer ? [...userAnswer].sort() : []; isCorrect = JSON.stringify(correct) === JSON.stringify(userAns); }
                else if (q.type === 'textInput') isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswers[0].trim().toLowerCase();
                else if (q.type === 'trueFalse') isCorrect = userAnswer === q.correctAnswer;
                else if (q.type === 'ordering') isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.orderItems);
            }
            
            if (isCorrect) {
                score += questionPoints;
                correctAnswersCount++;
            }
        });

        const resultData = { 
            userName: profile?.first_name || session.user.email.split('@')[0],
            userSurname: profile?.last_name || '',
            quizTitle: quiz.title, 
            quizId: quiz.id, 
            score,
            totalPoints,
            correctAnswersCount,
            totalQuestions: (quiz.questions || []).length,
            percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0, 
            status: hasOpenQuestions ? 'pending_review' : 'completed',
            userAnswers: answers, 
            questionOrder: questionsInOrder,
            user_id: session.user.id
        };

        const { data: newResult, error } = await supabase.from('quiz_results').insert(resultData).select().single();

        if (error) {
            showToast(`Nəticəni yadda saxlayarkən xəta: ${error.message}`);
        } else {
            setQuizResults(prev => [newResult, ...prev]);
            setLastResult(newResult);
            navigate(`/quiz/${quiz.id}/result`);
        }
    };

    const handleImportRequest = (quizId) => {
        if (!checkAdmin()) return;
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

                    setEditingQuizDraft(prev => ({...prev, questions: [...(prev.questions || []), ...newQuestions]}));
                    showToast(`${newQuestions.length} sual uğurla idxal edildi!`);
                } catch (error) {
                    showToast('Faylın emalı zamanı xəta baş verdi.');
                    console.error(error);
                }
            }
        });
    };

    const handleAddFromBankRequest = (quizId) => {
        if (!checkAdmin()) return;
        setQuizToAddTo(quizId);
        setIsAddFromBankModalOpen(true);
    };

    const handleAddQuestionsFromBank = (questionIds) => {
        const questionsToAdd = questionBank.filter(q => questionIds.includes(q.id));
        setEditingQuizDraft(prev => ({...prev, questions: [...(prev.questions || []), ...questionsToAdd.map(q => ({...q, id: Date.now() + Math.random()}))]}));
        showToast(`${questionsToAdd.length} sual bankdan əlavə edildi.`);
    };

    const handleUpdateResult = async (updatedResult) => {
        const { id, ...resultData } = updatedResult;
        const { data, error } = await supabase.from('quiz_results').update(resultData).eq('id', id).select().single();
        if (error) {
            showToast(`Nəticəni yeniləyərkən xəta: ${error.message}`);
        } else {
            setQuizResults(prev => prev.map(r => r.id === id ? data : r));
            navigate('/stats');
            showToast('Nəticə uğurla yeniləndi!');
        }
    };

    const handleReviewRequest = (result) => {
        if (profile?.role !== 'admin') {
            showToast('Bu əməliyyat üçün admin hüququ tələb olunur.');
            return;
        }
        if (result.status === 'pending_review') {
            navigate(`/manual-review/${result.id}`);
        } else {
            navigate(`/review/${result.id}`);
        }
    };

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showToast('Çıxış zamanı xəta baş verdi');
        } else {
            setProfile(null);
            setSession(null);
            navigate('/');
            showToast('Uğurla çıxış etdiniz.');
        }
    };

    const handleProfileUpdate = (updatedProfile) => {
        setProfile(updatedProfile);
    };

    const fetchComments = async (questionId) => {
        const { data, error } = await supabase
            .from('comments')
            .select(`*, profiles(id, first_name, last_name)`)
            .eq('question_id', questionId)
            .order('created_at', { ascending: true });
        if (error) {
            showToast('Şərhləri yükləyərkən xəta baş verdi.');
            return [];
        }
        return data;
    };

    const postComment = async (questionId, content) => {
        const { data, error } = await supabase
            .from('comments')
            .insert({ question_id: questionId, content, user_id: session.user.id })
            .select(`*, profiles(id, first_name, last_name)`)
            .single();
        if (error) {
            showToast(`Şərh göndərilərkən xəta: ${error.message}`);
            return null;
        }
        return data;
    };

    const deleteComment = async (commentId) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) {
            showToast(`Şərhi silərkən xəta: ${error.message}`);
            return false;
        }
        showToast('Şərh silindi.');
        return true;
    };

    if (isAuthLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-orange-50">Sessiya yoxlanılır...</div>;
    }

    return (
        <>
            <Routes>
                <Route path="/auth" element={<AuthPage showToast={showToast} />} />
                <Route path="/*" element={
                    session ? (
                        <div className="bg-orange-50 min-h-screen font-sans text-gray-900">
                            <header className="bg-white shadow-md sticky top-0 z-40">
                                <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
                                    <Link to="/" className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">EduventureWithSeda</Link>
                                    <div className="flex items-center gap-2">
                                        {profile?.role === 'admin' && (
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <Link to="/leaderboard"><Button as="span" variant="secondary"><LeaderboardIcon /><span className="hidden md:inline ml-2">Reytinqlər</span></Button></Link>
                                                <Link to="/stats"><Button as="span" variant="secondary"><ChartBarIcon /><span className="hidden md:inline ml-2">Statistika</span></Button></Link>
                                                <Button onClick={handleQuestionBankRequest} variant="secondary"><LibraryIcon /><span className="hidden md:inline ml-2">Suallar Bankı</span></Button>
                                            </div>
                                        )}
                                        <Link to="/profile" className="text-sm text-gray-600 hidden sm:inline hover:underline ml-2">
                                            {profile?.first_name || session.user.email} {profile?.last_name}
                                        </Link>
                                        <Button onClick={handleSignOut} variant="danger"><LogoutIcon /></Button>
                                    </div>
                                </div>
                            </header>
                            <main className="container mx-auto px-4 py-6 md:py-8">
                                <Routes>
                                    <Route path="/" element={<QuizListPageWrapper quizzes={quizzes} onStartQuiz={handleStartQuizRequest} onAddNewQuiz={handleAddNewQuizRequest} onEditQuiz={handleEditQuizRequest} onDeleteRequest={handleDeleteQuizRequest} onCloneQuiz={handleCloneQuizRequest} onArchiveRequest={handleArchiveQuizRequest} onStartSmartPractice={handleStartSmartPractice} isAdmin={profile?.role === 'admin'} />} />
                                    <Route path="/stats" element={<StatisticsPageWrapper results={quizResults} quizzes={quizzes} onReviewResult={handleReviewRequest} />} />
                                    <Route path="/student/:userId" element={<StudentReportPageWrapper results={quizResults} onReviewResult={handleReviewRequest} />} />
                                    <Route path="/question-bank" element={<QuestionBankPageWrapper questionBank={questionBank} onSave={handleSaveQuestionToBank} onDelete={handleDeleteQuestionFromBank} showToast={showToast} />} />
                                    <Route path="/review/:resultId" element={<PastQuizReviewPageWrapper quizResults={quizResults} quizzes={quizzes} profile={profile} fetchComments={fetchComments} postComment={postComment} deleteComment={deleteComment} />} />
                                    <Route path="/manual-review/:resultId" element={<ManualReviewPageWrapper results={quizResults} quizzes={quizzes} onUpdateResult={handleUpdateResult} />} />
                                    <Route path="/profile" element={<ProfilePage session={session} profile={profile} showToast={showToast} onProfileUpdate={handleProfileUpdate} />} />
                                    <Route path="/leaderboard" element={<LeaderboardPageWrapper results={quizResults} />} />
                                    <Route path="/quiz/:id/edit" element={<QuizPageWrapper pageType="edit" {...{ editingQuizDraft, quizzes, existingCategories, showToast, handleSaveQuiz, handleImportRequest, handleAddFromBankRequest, setEditingQuizDraft }} />} />
                                    <Route path="/quiz/:id/take" element={<QuizPageWrapper pageType="take" {...{ quizzes, profile, handleSubmitQuiz }} />} />
                                    <Route path="/quiz/:id/practice" element={<QuizPageWrapper pageType="practice" {...{ quizzes }} />} />
                                    <Route path="/practice/custom" element={<QuizPageWrapper pageType="custom_practice" {...{ customPracticeQuiz, profile }} />} />
                                    <Route path="/quiz/:id/result" element={<QuizPageWrapper pageType="result" {...{ quizzes, lastResult, quizResults }} />} />
                                    <Route path="/quiz/:id/review" element={<QuizPageWrapper pageType="review" {...{ quizzes, lastResult, quizResults, session, profile }} />} />
                                </Routes>
                            </main>
                            <footer className="text-center py-4 text-gray-500 text-sm"><p>&copy; {new Date().getFullYear()} EduventureWithSeda. Bütün hüquqlar qorunur.</p></footer>
                        </div>
                    ) : <AuthPage showToast={showToast} />
                } />
            </Routes>
            <Toast message={toast.message} isVisible={toast.isVisible} />
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, quizIdToDelete: null })} onConfirm={confirmDelete} title="Silməni təsdiqləyin"><p>Bu testi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmazdır.</p></Modal>
            <PasscodeModal isOpen={isPasscodeModalOpen} onClose={() => setIsPasscodeModalOpen(false)} onConfirm={handlePasscodeConfirm} showToast={showToast} />
            <ModeSelectionModal isOpen={isModeSelectionModalOpen} onClose={() => setIsModeSelectionModalOpen(false)} onSelect={handleModeSelected} />
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportQuestions} showToast={showToast} />
            <AddFromBankModal isOpen={isAddFromBankModalOpen} onClose={() => setIsAddFromBankModalOpen(false)} onAdd={handleAddQuestionsFromBank} showToast={showToast} questionBank={questionBank} />
            <WavingCat />
        </>
    );
}
