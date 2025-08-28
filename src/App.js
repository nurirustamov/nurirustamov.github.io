import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, Link, useLocation, createSearchParams } from 'react-router-dom';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';

// --- UI Компоненты ---
import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';
import WavingCat from './components/WavingCat';
import Button from './components/ui/Button';
import { ChartBarIcon, BookOpenIcon, PencilAltIcon, UploadIcon, LibraryIcon, PlusIcon, LogoutIcon, TrophyIcon as LeaderboardIcon, UserCircleIcon, ShieldCheckIcon, DocumentTextIcon, CollectionIcon, BellIcon } from './assets/icons';

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
import AdminPage from './pages/AdminPage';
import UserManagementPage from './pages/UserManagementPage';
import QuizAnalysisPage from './pages/QuizAnalysisPage';
import ArticleListPage from './pages/ArticleListPage';
import ArticleEditorPage from './pages/ArticleEditorPage';
import PublicArticleListPage from './pages/PublicArticleListPage';
import ArticleViewPage from './pages/ArticleViewPage';
import CourseListPage from './pages/CourseListPage';
import CourseEditorPage from './pages/CourseEditorPage';
import PublicCourseListPage from './pages/PublicCourseListPage';
import CourseViewPage from './pages/CourseViewPage';

// --- Новый компонент уведомлений ---
const NotificationBell = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleNotificationClick = (notification) => {
        onMarkAsRead(notification.id);
        setIsOpen(false);
        // Дополнительно можно использовать navigate(notification.target_url) если он есть
    };

    return (
        <div className="relative">
            <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}>
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{unreadCount}</span>
                )}
            </Button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                        <div className="flex justify-between items-center px-4 py-2 border-b">
                            <h3 className="font-bold">Bildirişlər</h3>
                            {unreadCount > 0 && <button onClick={onMarkAllAsRead} className="text-sm text-orange-600 hover:underline">Hamısını oxu</button>}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <Link to={n.target_url || '#'} key={n.id} onClick={() => handleNotificationClick(n)} className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 ${!n.is_read ? 'bg-orange-50' : ''}`}>
                                        <p className="font-semibold">{n.content.title}</p>
                                        <p>{n.content.body}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-500">Hələlik bildiriş yoxdur.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


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

const QuizAnalysisPageWrapper = ({ quizzes, results }) => (
    <QuizAnalysisPage quizzes={quizzes} results={results} />
);

const ArticleEditorPageWrapper = ({ onSave, showToast, ...props }) => {
    const { articleId } = useParams();
    const article = articleId ? props.articles.find(a => a.id === Number(articleId)) : props.editingArticleDraft;

    if (!article) return <div>Yüklənir...</div>;

    return <ArticleEditorPage {...props} article={article} onSave={onSave} showToast={showToast} />;
};

const ArticleViewPageWrapper = ({ articles, quizzes, onStartQuiz, onMarkAsRead, articleProgress, profile, fetchComments, postComment, deleteComment }) => (
    <ArticleViewPage articles={articles} quizzes={quizzes} onStartQuiz={onStartQuiz} onMarkAsRead={onMarkAsRead} articleProgress={articleProgress} profile={profile} fetchComments={fetchComments} postComment={postComment} deleteComment={deleteComment} />
);

const CourseEditorPageWrapper = ({ editingCourseDraft, setEditingCourseDraft, articles, quizzes, onSave, showToast }) => {
    if (!editingCourseDraft) return <div className="text-center py-12">Yüklənir...</div>;
    return <CourseEditorPage
        course={editingCourseDraft}
        onDraftChange={setEditingCourseDraft}
        articles={articles}
        quizzes={quizzes}
        onSave={onSave}
        showToast={showToast}
    />;
};

const CourseViewPageWrapper = ({ courses, onStartQuiz, articleProgress, quizResults, session }) => {
    return <CourseViewPage courses={courses} onStartQuiz={onStartQuiz} articleProgress={articleProgress} quizResults={quizResults} session={session} />;
};

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
                             handleSubmitQuiz,
                             fetchComments,
                             postComment,
                             deleteComment
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
            return <QuizReviewPage quiz={quiz} userAnswers={resultForReview.userAnswers} questionOrder={resultForReview.questionOrder} onBack={() => navigate(-1)} profile={profile} fetchComments={fetchComments} postComment={postComment} deleteComment={deleteComment} />;
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
    const [articles, setArticles] = useState([]);
    const [courses, setCourses] = useState([]);
    const [articleProgress, setArticleProgress] = useState([]);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [customPracticeQuiz, setCustomPracticeQuiz] = useState(null);
    const [editingCourseDraft, setEditingCourseDraft] = useState(null);
    const [editingQuizDraft, setEditingQuizDraft] = useState(null);
    const [editingArticleDraft, setEditingArticleDraft] = useState(null);
    const [userAchievements, setUserAchievements] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // For admin panel

    const [lastResult, setLastResult] = useState(null);
    const [toast, setToast] = useState({ message: '', isVisible: false });

    const [quizToStartId, setQuizToStartId] = useState(null);
    const [isModeSelectionModalOpen, setIsModeSelectionModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, idToDelete: null, type: null });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [quizToImportInto, setQuizToImportInto] = useState(null);
    const [isAddFromBankModalOpen, setIsAddFromBankModalOpen] = useState(false);
    const [quizToAddTo, setQuizToAddTo] = useState(null);
    const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
    const [passcodeQuiz, setPasscodeQuiz] = useState(null);

    const navigate = useNavigate();

    const showToast = useCallback((message) => {
        setToast({ message, isVisible: true });
        setTimeout(() => setToast({ message: '', isVisible: false }), 3000);
    }, []);

    const handleAddExperience = useCallback(async (pointsToAdd) => {
        if (!profile || pointsToAdd <= 0) return;

        const newExperience = (profile.experience_points || 0) + pointsToAdd;

        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({ experience_points: newExperience })
            .eq('id', profile.id)
            .select()
            .single();

        if (error) {
            showToast('Təcrübə xalı əlavə edilərkən xəta baş verdi.');
        } else {
            setProfile(updatedProfile);
            showToast(`+${pointsToAdd} təcrübə xalı qazandınız!`);
        }
    }, [profile, showToast]);

    const handleCourseCompletionCheck = useCallback(async (courseId) => {
        if (!profile || !courseId || completedCourses.some(c => c.course_id === courseId)) {
            return;
        }

        const course = courses.find(c => c.id === courseId);
        if (!course || !course.course_items || course.course_items.length === 0) {
            return;
        }

        const articleIdsInCourse = new Set(course.course_items.filter(i => i.item_type === 'article').map(i => i.article_id));
        const quizIdsInCourse = new Set(course.course_items.filter(i => i.item_type === 'quiz').map(i => i.quiz_id));

        const completedArticleIds = new Set(articleProgress.map(p => p.article_id));
        const completedQuizIds = new Set(quizResults.filter(r => r.status === 'completed').map(r => r.quizId));

        const allArticlesRead = [...articleIdsInCourse].every(id => completedArticleIds.has(id));
        const allQuizzesDone = [...quizIdsInCourse].every(id => completedQuizIds.has(id));

        if (allArticlesRead && allQuizzesDone) {
            const { data, error } = await supabase
                .from('user_course_completions')
                .insert({ user_id: profile.id, course_id: courseId })
                .select()
                .single();

            if (!error && data) {
                setCompletedCourses(prev => [...prev, data]);
                showToast(`Təbriklər! "${course.title}" kursunu tamamladınız!`);
                await handleAddExperience(50); // Award 50 XP for course completion
            }
        }
    }, [profile, completedCourses, courses, articleProgress, quizResults, handleAddExperience, showToast]);

    const fetchNotifications = useCallback(async () => {
        if (session?.user) {
            const { data: notificationsData, error } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching notifications:", error);
                showToast("Bildirişlər yüklənərkən xəta baş verdi.");
            } else {
                setNotifications(notificationsData || []);
            }
        }
    }, [session, showToast]);

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
                let { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

                if (profileError) {
                    showToast('Profil yüklənərkən xəta baş verdi.');
                    setProfile(null);
                } else {
                    // --- GAMIFICATION: Daily Streak Logic ---
                    const today = new Date();
                    const lastLoginDate = profileData.last_login ? new Date(profileData.last_login) : null;
                    let needsUpdate = false;
                    let updates = {};

                    if (!lastLoginDate) { // First login ever
                        needsUpdate = true;
                        updates = { daily_streak: 1, last_login: today.toISOString() };
                        showToast('Xoş gəlmisiniz! İlk günlük girişiniz üçün +1 seriya qazandınız!');
                    } else {
                        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const lastLoginMidnight = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
                        const diffDays = Math.round((todayMidnight - lastLoginMidnight) / (1000 * 60 * 60 * 24));

                        if (diffDays === 1) { // Consecutive day
                            needsUpdate = true;
                            const newStreak = (profileData.daily_streak || 0) + 1;
                            updates = { daily_streak: newStreak, last_login: today.toISOString() };
                            showToast(`Günlük seriyanız: ${newStreak} gün! Davam edin!`);
                        } else if (diffDays > 1) { // Streak broken
                            needsUpdate = true;
                            updates = { daily_streak: 1, last_login: today.toISOString() };
                            showToast('Günlük seriyanız sıfırlandı. Yeni seriyaya başlayın!');
                        }
                    }

                    if (needsUpdate) {
                        const { data: updatedProfile, error: updateError } = await supabase
                            .from('profiles')
                            .update(updates)
                            .eq('id', session.user.id)
                            .select()
                            .single();

                        if (!updateError) {
                            profileData = updatedProfile; // Use the updated profile for the rest of this session
                        }
                    }
                    // --- End of Gamification Logic ---

                    setProfile(profileData);

                    if (profileData.role === 'admin') {
                        const { data: usersData } = await supabase.from('profiles').select('*');
                        setAllUsers(usersData || []);
                    }
                }

                const { data: quizzesData } = await supabase.from('quizzes').select('*').order('id', { ascending: false });
                setQuizzes(quizzesData || []);

                const { data: questionBankData } = await supabase.from('question_bank').select('*').order('created_at', { ascending: false });
                setQuestionBank(questionBankData || []);

                const { data: resultsData } = await supabase.from('quiz_results').select('*').order('created_at', { ascending: false });
                setQuizResults(resultsData || []);

                let articlesQuery = supabase.from('articles').select('*, article_quizzes(quiz_id)');
                if (profileData?.role !== 'admin') {
                    articlesQuery = articlesQuery.eq('is_published', true);
                }
                const { data: articlesData } = await articlesQuery.order('created_at', { ascending: false });
                setArticles(articlesData || []);

                let coursesQuery = supabase.from('courses').select('*, course_items(*, articles(title), quizzes(title))');
                if (profileData?.role !== 'admin') {
                    coursesQuery = coursesQuery.eq('is_published', true);
                }
                const { data: coursesData } = await coursesQuery.order('created_at', { ascending: false });
                setCourses(coursesData || []);

                const { data: progressData } = await supabase.from('user_article_progress').select('article_id').eq('user_id', session.user.id);
                setArticleProgress(progressData || []);

                const { data: completionsData } = await supabase.from('user_course_completions').select('course_id').eq('user_id', session.user.id);
                setCompletedCourses(completionsData || []);

                await fetchNotifications();

                const { data: achievementsData } = await supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', session.user.id);
                setUserAchievements(achievementsData || []);

                const { data: allAchievementsData } = await supabase.from('achievements').select('*');
                setAllAchievements(allAchievementsData || []);

            } else {
                setProfile(null);
                setQuizzes([]);
                setQuestionBank([]);
                setQuizResults([]);
                setUserAchievements([]);
                setAllAchievements([]);
                setAllUsers([]);
                setArticles([]);
                setArticleProgress([]);
                setCourses([]);
                setCompletedCourses([]);
                setNotifications([]);
            }
        };

        if (!isAuthLoading) {
            fetchUserData();
        }
    }, [session?.user?.id, isAuthLoading, fetchNotifications, showToast]);

    // --- REALTIME NOTIFICATIONS --- //
    useEffect(() => {
        if (!session?.user?.id) return;

        const channel = supabase
            .channel(`public:notifications:user_id=eq.${session.user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    showToast('Yeni bildirişiniz var!');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, showToast]);

    const existingQuizCategories = useMemo(() => {
        const categories = new Set(quizzes.map(q => q.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [quizzes]);

    const existingArticleCategories = useMemo(() => {
        const categories = new Set(articles.map(a => a.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [articles]);

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
            setEditingQuizDraft(newQuiz);
            navigate(`/quiz/${newQuiz.id}/edit`);
            showToast('Yeni test uğurla yaradıldı!');
        }
    };

    const handleEditQuizRequest = (quizId) => {
        if (checkAdmin()) {
            const quizToEdit = quizzes.find(q => q.id === quizId);
            if (quizToEdit) {
                setEditingQuizDraft(quizToEdit);
                navigate(`/quiz/${quizId}/edit`);
            }
        }
    };

    const handleDeleteRequest = (id, type) => {
        if (!checkAdmin()) return;
        setDeleteModal({ isOpen: true, idToDelete: id, type: type });
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
            setEditingQuizDraft(null);
            showToast("Test uğurla yeniləndi!");
            navigate('/');
        }
    };

    const confirmDelete = async () => {
        const { idToDelete, type } = deleteModal;
        let error;
        if (type === 'quiz') {
            const { error: quizError } = await supabase.from('quizzes').delete().eq('id', idToDelete);
            error = quizError;
            if (!error) setQuizzes(prev => prev.filter(q => q.id !== idToDelete));
        } else if (type === 'article') {
            const { error: articleError } = await supabase.from('articles').delete().eq('id', idToDelete);
            error = articleError;
            if (!error) setArticles(prev => prev.filter(a => a.id !== idToDelete));
        } else if (type === 'course') {
            const { error: courseError } = await supabase.from('courses').delete().eq('id', idToDelete);
            error = courseError;
            if (!error) setCourses(prev => prev.filter(c => c.id !== idToDelete));
        }

        if (error) {
            showToast(`${type} silərkən xəta: ${error.message}`);
        } else {
            showToast(`${type} uğurla silindi!`);
        }
        setDeleteModal({ isOpen: false, idToDelete: null, type: null });
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

    const checkAndAwardAchievements = async (newResult) => {
        const { data: allAchievementsFromDb } = await supabase.from('achievements').select('*');
        if (!allAchievementsFromDb) return;

        const userAchievementIds = new Set(userAchievements.map(a => a.achievement_id));
        const newAchievementsToAward = [];

        const newbieId = allAchievementsFromDb.find(a => a.icon_name === 'newbie')?.id;
        if (newbieId && !userAchievementIds.has(newbieId)) {
            const { count } = await supabase.from('quiz_results').select('id', { count: 'exact', head: true }).eq('user_id', newResult.user_id);
            if (count === 1) {
                newAchievementsToAward.push({ user_id: newResult.user_id, achievement_id: newbieId });
            }
        }

        const sniperId = allAchievementsFromDb.find(a => a.icon_name === 'sniper')?.id;
        if (sniperId && newResult.percentage === 100 && !userAchievementIds.has(sniperId)) {
            newAchievementsToAward.push({ user_id: newResult.user_id, achievement_id: sniperId });
        }

        const marathonerId = allAchievementsFromDb.find(a => a.icon_name === 'marathoner')?.id;
        if (marathonerId && !userAchievementIds.has(marathonerId)) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { count } = await supabase.from('quiz_results').select('id', { count: 'exact', head: true }).eq('user_id', newResult.user_id).gt('created_at', sevenDaysAgo.toISOString());
            if (count >= 5) {
                newAchievementsToAward.push({ user_id: newResult.user_id, achievement_id: marathonerId });
            }
        }

        if (newAchievementsToAward.length > 0) {
            const { data: awarded, error } = await supabase.from('user_achievements').insert(newAchievementsToAward).select('*, achievements(*)');
            if (!error && awarded) {
                setUserAchievements(prev => [...prev, ...awarded]);
                awarded.forEach(a => showToast(`Yeni nailiyyət: ${a.achievements.name}!`));
            }
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
            await checkAndAwardAchievements(newResult);
            if (newResult.percentage >= 50) {
                await handleAddExperience(10 + newResult.score);
            }
            setQuizResults(prev => [newResult, ...prev]);
            setLastResult(newResult);
            navigate(`/quiz/${quiz.id}/result`);

            // Check for course completion
            courses.forEach(course => {
                if (course.course_items.some(item => item.quiz_id === quizId)) {
                    handleCourseCompletionCheck(course.id);
                }
            });
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
        if (profile?.role === 'admin' || result.user_id === profile?.id) {
            if (result.status === 'pending_review' && profile?.role === 'admin') {
                navigate(`/manual-review/${result.id}`);
            } else {
                navigate(`/review/${result.id}`);
            }
        } else {
            showToast('Bu nəticəyə baxmaq üçün icazəniz yoxdur.');
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

    const handleRoleChange = async (userId, newRole) => {
        if (!checkAdmin()) return;
        const { data, error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId).select().single();
        if (error) {
            showToast(`Rolu dəyişərkən xəta: ${error.message}`);
        } else {
            setAllUsers(prevUsers => prevUsers.map(u => u.id === userId ? data : u));
            showToast('Rol uğurla dəyişdirildi.');
        }
    };

    const handleSaveArticle = async (articleData) => {
        if (!checkAdmin()) return;

        const { selectedQuizIds, ...articleCoreData } = articleData;
        const dataToSave = {
            title: articleCoreData.title,
            content: articleCoreData.content,
            category: articleCoreData.category,
            author_id: session.user.id,
            is_published: articleCoreData.is_published || false
        };

        let savedArticle;
        if (articleCoreData.id) {
            const { data, error } = await supabase.from('articles').update(dataToSave).eq('id', articleCoreData.id).select('id').single();
            if (error) { showToast(`Məqaləni yeniləyərkən xəta: ${error.message}`); return; }
            savedArticle = data;
        } else {
            const { data, error } = await supabase.from('articles').insert(dataToSave).select('id').single();
            if (error) { showToast(`Məqaləni yaradarkən xəta: ${error.message}`); return; }
            savedArticle = data;
        }

        const { error: deleteError } = await supabase.from('article_quizzes').delete().eq('article_id', savedArticle.id);
        if (deleteError) { showToast(`Test əlaqələrini yeniləyərkən xəta: ${deleteError.message}`); return; }

        if (selectedQuizIds && selectedQuizIds.length > 0) {
            const relationsToInsert = selectedQuizIds.map(quiz_id => ({ article_id: savedArticle.id, quiz_id }));
            const { error: insertError } = await supabase.from('article_quizzes').insert(relationsToInsert);
            if (insertError) { showToast(`Test əlaqələrini yaradarkən xəta: ${insertError.message}`); return; }
        }

        const { data: finalArticle, error: finalFetchError } = await supabase
            .from('articles')
            .select('*, article_quizzes(quiz_id)')
            .eq('id', savedArticle.id)
            .single();

        if (finalFetchError) {
            showToast('Məqalə yadda saxlanıldı, lakin məlumatları yeniləmək mümkün olmadı. Səhifəni yeniləyin.');
        } else {
            setArticles(prev => {
                const index = prev.findIndex(a => a.id === finalArticle.id);
                if (index !== -1) {
                    const newArticles = [...prev];
                    newArticles[index] = finalArticle;
                    return newArticles;
                } else {
                    return [finalArticle, ...prev];
                }
            });
            showToast('Məqalə uğurla yadda saxlandı!');
        }

        navigate(`/admin/articles`);
    };

    const handleMarkArticleAsRead = async (articleId) => {
        if (articleProgress.some(p => p.article_id === articleId)) {
            return;
        }

        const { data, error } = await supabase.from('user_article_progress').insert({ user_id: session.user.id, article_id: articleId }).select().single();
        if (error) {
            showToast('Proqresi yadda saxlayarkən xəta baş verdi.');
        } else {
            setArticleProgress(prev => [...prev, data]);
            showToast('Məqalə oxunmuş kimi işarələndi!');
            await handleAddExperience(5);

            // Check for course completion
            courses.forEach(course => {
                if (course.course_items.some(item => item.article_id === articleId)) {
                    handleCourseCompletionCheck(course.id);
                }
            });
        }
    };

    const handleToggleArticleStatus = async (articleId, newStatus) => {
        if (!checkAdmin()) return;
        const { data, error } = await supabase.from('articles').update({ is_published: newStatus }).eq('id', articleId).select('*, article_quizzes(quiz_id)').single();
        if (error) {
            showToast('Statusu dəyişərkən xəta baş verdi.');
        } else {
            setArticles(prev => prev.map(a => a.id === articleId ? data : a));
            showToast(newStatus ? 'Məqalə dərc edildi!' : 'Məqalə gizlədildi.');
        }
    };

    const handleSaveCourse = async (courseData) => {
        if (!checkAdmin()) return;
        const { items, ...courseCoreData } = courseData;
        const courseDetails = {
            title: courseCoreData.title,
            description: courseCoreData.description,
            author_id: session.user.id,
            is_published: courseCoreData.is_published || false
        };

        let savedCourse;
        if (courseCoreData.id) {
            const { data, error } = await supabase.from('courses').update(courseDetails).eq('id', courseCoreData.id).select().single();
            if (error) { showToast(`Kursu yeniləyərkən xəta: ${error.message}`); return; }
            savedCourse = data;
        } else {
            const { data, error } = await supabase.from('courses').insert(courseDetails).select().single();
            if (error) { showToast(`Kursu yaradarkən xəta: ${error.message}`); return; }
            savedCourse = data;
        }

        const { error: deleteError } = await supabase.from('course_items').delete().eq('course_id', savedCourse.id);
        if (deleteError) { showToast(`Kursun tərkibini yeniləyərkən xəta: ${deleteError.message}`); return; }

        if (items && items.length > 0) {
            const itemsToInsert = items.map((item, index) => {
                const baseItem = {
                    course_id: savedCourse.id,
                    order: index,
                };
                if (item.item_type === 'article') {
                    baseItem.article_id = item.item_id;
                } else if (item.item_type === 'quiz') {
                    baseItem.quiz_id = item.item_id;
                }
                return baseItem;
            }).filter(item => item.article_id || item.quiz_id);

            if (itemsToInsert.length > 0) {
                const { error: insertError } = await supabase.from('course_items').insert(itemsToInsert);
                if (insertError) { showToast(`Kursun tərkibini yaradarkən xəta: ${insertError.message}`); return; }
            }
        }

        const { data: finalCourse } = await supabase.from('courses').select('*, course_items(*, articles(title), quizzes(title))').eq('id', savedCourse.id).single();
        if (!finalCourse) {
            showToast('Kurs yadda saxlanıldı, lakin məlumatları yeniləmək mümkün olmadı. Səhifəni yeniləyin.');
            navigate('/admin/courses');
            return;
        }
        setCourses(prev => {
            const index = prev.findIndex(c => c.id === finalCourse.id);
            if (index !== -1) {
                const newCourses = [...prev];
                newCourses[index] = finalCourse;
                return newCourses;
            } else {
                return [finalCourse, ...prev];
            }
        });
        setEditingCourseDraft(null);
        showToast('Kurs uğurla yadda saxlandı!');
        navigate('/admin/courses');
    };

    const handleToggleCourseStatus = async (courseId, newStatus) => {
        if (!checkAdmin()) return;
        const { data, error } = await supabase.from('courses').update({ is_published: newStatus }).eq('id', courseId).select('*, course_items(*, articles(title), quizzes(title))').single();
        if (error) {
            showToast('Statusu dəyişərkən xəta baş verdi.');
        } else if (data) {
            setCourses(prev => prev.map(c => c.id === courseId ? data : c));
            showToast(newStatus ? 'Kurs dərc edildi!' : 'Kurs gizlədildi.');
        }
    };

    const fetchComments = async (targetId, targetType) => {
        const { data, error } = await supabase.from('comments').select(`*, profiles(id, first_name, last_name)`).eq(`${targetType}_id`, targetId).order('created_at', { ascending: true });
        if (error) {
            showToast('Şərhləri yükləyərkən xəta baş verdi.');
            return [];
        }
        return data;
    };

    const postComment = async (targetId, targetType, content, parentCommentId = null, targetUrl = null) => {
        const { data: newComment, error } = await supabase
            .from('comments')
            .insert({ 
                content, 
                user_id: session.user.id, 
                [`${targetType}_id`]: targetId,
                parent_comment_id: parentCommentId
            })
            .select(`*, profiles(id, first_name, last_name)`)
            .single();

        if (error) {
            showToast(`Şərh göndərilərkən xəta: ${error.message}`);
            return null;
        }

        // Create notification for the parent comment author
        if (parentCommentId) {
            const { error: rpcError } = await supabase.rpc('create_reply_notification', {
                parent_comment_id_in: parentCommentId,
                reply_author_profile_in: { first_name: profile.first_name },
                target_url_in: targetUrl || '#'
            });

            if (rpcError) {
                console.error('Error calling RPC function:', rpcError);
                showToast('Bildiriş göndərilərkən xəta baş verdi.');
            }
        }

        return newComment;
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

    const handleMarkNotificationAsRead = async (notificationId) => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        }
    };

    const handleMarkAllNotificationsAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;
        const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    const handleNewArticle = () => {
        if (!checkAdmin()) return;
        setEditingArticleDraft({ title: '', content: '', category: '', article_quizzes: [] });
        navigate('/admin/articles/new');
    };

    const handleEditArticle = (articleId) => {
        if (!checkAdmin()) return;
        const articleToEdit = articles.find(a => a.id === articleId);
        if (articleToEdit) {
            setEditingArticleDraft(articleToEdit);
            navigate(`/admin/articles/edit/${articleId}`);
        }
    };

    const handleNewCourse = () => {
        if (!checkAdmin()) return;
        setEditingCourseDraft({
            title: 'Yeni Kurs',
            description: '',
            is_published: false,
            items: []
        });
        navigate('/admin/courses/new');
    };

    const handleEditCourse = (courseId) => {
        if (!checkAdmin()) return;
        const courseToEdit = courses.find(c => c.id === courseId);
        if (courseToEdit) {
            const draft = {
                id: courseToEdit.id,
                title: courseToEdit.title || '',
                description: courseToEdit.description || '',
                is_published: courseToEdit.is_published || false,
                items: (courseToEdit.course_items || []).map(item => (item.article_id && item.articles) ? { item_id: item.article_id, item_type: 'article', title: item.articles.title, order: item.order } : (item.quiz_id && item.quizzes) ? { item_id: item.quiz_id, item_type: 'quiz', title: item.quizzes.title, order: item.order } : null).filter(Boolean).sort((a, b) => a.order - b.order),
            };
            setEditingCourseDraft(draft);
            navigate(`/admin/courses/edit/${courseId}`);
        }
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
                                        <Link to="/courses"><Button as="span" variant="secondary"><CollectionIcon /><span className="hidden md:inline ml-2">Kurslar</span></Button></Link>
                                        <Link to="/articles"><Button as="span" variant="secondary"><DocumentTextIcon /><span className="hidden md:inline ml-2">Məqalələr</span></Button></Link>
                                        {profile?.role === 'admin' && (
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <Link to="/admin/users"><Button as="span" variant="secondary"><ShieldCheckIcon /><span className="hidden md:inline ml-2">Admin Panel</span></Button></Link>
                                                <Link to="/leaderboard"><Button as="span" variant="secondary"><LeaderboardIcon /><span className="hidden md:inline ml-2">Reytinqlər</span></Button></Link>
                                                <Link to="/stats"><Button as="span" variant="secondary"><ChartBarIcon /><span className="hidden md:inline ml-2">Statistika</span></Button></Link>
                                                <Button onClick={handleQuestionBankRequest} variant="secondary"><LibraryIcon /><span className="hidden md:inline ml-2">Suallar Bankı</span></Button>
                                            </div>
                                        )}
                                        <NotificationBell notifications={notifications} onMarkAsRead={handleMarkNotificationAsRead} onMarkAllAsRead={handleMarkAllNotificationsAsRead} />
                                        <Link to="/profile">
                                            <Button variant="secondary"><UserCircleIcon /><span className="hidden sm:inline ml-2">Profil</span></Button>
                                        </Link>
                                        <Button onClick={handleSignOut} variant="danger"><LogoutIcon /></Button>
                                    </div>
                                </div>
                            </header>
                            <main className="container mx-auto px-4 py-6 md:py-8">
                                <Routes>
                                    <Route path="/" element={<QuizListPageWrapper quizzes={quizzes} onStartQuiz={handleStartQuizRequest} onAddNewQuiz={handleAddNewQuizRequest} onEditQuiz={handleEditQuizRequest} onDeleteRequest={(id) => handleDeleteRequest(id, 'quiz')} onCloneQuiz={handleCloneQuizRequest} onArchiveRequest={handleArchiveQuizRequest} onStartSmartPractice={handleStartSmartPractice} isAdmin={profile?.role === 'admin'} />} />
                                    <Route path="/stats" element={<StatisticsPageWrapper results={quizResults} quizzes={quizzes} onReviewResult={handleReviewRequest} />} />
                                    <Route path="/stats/quiz/:quizId" element={<QuizAnalysisPageWrapper quizzes={quizzes} results={quizResults} />} />
                                    <Route path="/student/:userId" element={<StudentReportPageWrapper results={quizResults} onReviewResult={handleReviewRequest} />} />
                                    <Route path="/question-bank" element={<QuestionBankPageWrapper questionBank={questionBank} onSave={handleSaveQuestionToBank} onDelete={handleDeleteQuestionFromBank} showToast={showToast} />} />
                                    <Route path="/review/:resultId" element={<PastQuizReviewPageWrapper quizResults={quizResults} quizzes={quizzes} profile={profile} fetchComments={fetchComments} postComment={postComment} deleteComment={deleteComment} />} />
                                    <Route path="/manual-review/:resultId" element={<ManualReviewPageWrapper results={quizResults} quizzes={quizzes} onUpdateResult={handleUpdateResult} />} />
                                    <Route path="/profile" element={<ProfilePage session={session} profile={profile} showToast={showToast} onProfileUpdate={handleProfileUpdate} userAchievements={userAchievements} allAchievements={allAchievements} />} />
                                    <Route path="/leaderboard" element={<LeaderboardPageWrapper results={quizResults} />} />
                                    <Route path="/articles" element={<PublicArticleListPage articles={articles} articleProgress={articleProgress} />} />
                                    <Route path="/articles/:articleId" element={<ArticleViewPageWrapper articles={articles} quizzes={quizzes} onStartQuiz={handleStartQuizRequest} onMarkAsRead={handleMarkArticleAsRead} articleProgress={articleProgress} profile={profile} fetchComments={fetchComments} postComment={postComment} deleteComment={deleteComment} />} />
                                    <Route path="/courses" element={<PublicCourseListPage courses={courses} articleProgress={articleProgress} quizResults={quizResults} session={session} />} />
                                    <Route path="/courses/:courseId" element={<CourseViewPageWrapper courses={courses} onStartQuiz={handleStartQuizRequest} articleProgress={articleProgress} quizResults={quizResults} session={session} />} />
                                    <Route path="/admin" element={<AdminPage />}>
                                        <Route path="users" element={<UserManagementPage users={allUsers} onRoleChange={handleRoleChange} currentUserId={profile?.id} />} />
                                        <Route path="articles" element={<ArticleListPage articles={articles} onEdit={handleEditArticle} onDelete={(id) => handleDeleteRequest(id, 'article')} onAddNew={handleNewArticle} onToggleStatus={handleToggleArticleStatus} />} />
                                        <Route path="articles/new" element={<ArticleEditorPageWrapper articles={articles} quizzes={quizzes} onSave={handleSaveArticle} showToast={showToast} existingArticleCategories={existingArticleCategories} editingArticleDraft={editingArticleDraft} />} />
                                        <Route path="articles/edit/:articleId" element={<ArticleEditorPageWrapper articles={articles} quizzes={quizzes} onSave={handleSaveArticle} showToast={showToast} existingArticleCategories={existingArticleCategories} editingArticleDraft={editingArticleDraft} />} />
                                        <Route path="courses" element={<CourseListPage courses={courses} onEdit={handleEditCourse} onDelete={(id) => handleDeleteRequest(id, 'course')} onAddNew={handleNewCourse} onToggleStatus={handleToggleCourseStatus} />} />
                                        <Route path="courses/new" element={<CourseEditorPageWrapper editingCourseDraft={editingCourseDraft} setEditingCourseDraft={setEditingCourseDraft} articles={articles} quizzes={quizzes} onSave={handleSaveCourse} showToast={showToast} />} />
                                        <Route path="courses/edit/:courseId" element={<CourseEditorPageWrapper editingCourseDraft={editingCourseDraft} setEditingCourseDraft={setEditingCourseDraft} articles={articles} quizzes={quizzes} onSave={handleSaveCourse} showToast={showToast} />} />
                                    </Route>
                                    <Route path="/quiz/:id/edit" element={<QuizPageWrapper pageType="edit" {...{ editingQuizDraft, quizzes, existingCategories: existingQuizCategories, showToast, handleSaveQuiz, handleImportRequest, handleAddFromBankRequest, setEditingQuizDraft }} />} />
                                    <Route path="/quiz/:id/take" element={<QuizPageWrapper pageType="take" {...{ quizzes, profile, handleSubmitQuiz }} />} />
                                    <Route path="/quiz/:id/practice" element={<QuizPageWrapper pageType="practice" {...{ quizzes }} />} />
                                    <Route path="/practice/custom" element={<QuizPageWrapper pageType="custom_practice" {...{ customPracticeQuiz, profile }} />} />
                                    <Route path="/quiz/:id/result" element={<QuizPageWrapper pageType="result" {...{ quizzes, lastResult, quizResults }} />} />
                                    <Route path="/quiz/:id/review" element={<QuizPageWrapper pageType="review" {...{ quizzes, lastResult, quizResults, session, profile, fetchComments, postComment, deleteComment }} />} />
                                </Routes>
                            </main>
                            <footer className="text-center py-4 text-gray-500 text-sm"><p>&copy; {new Date().getFullYear()} EduventureWithSeda. Bütün hüquqlar qorunur.</p></footer>
                        </div>
                    ) : <AuthPage showToast={showToast} />
                } />
            </Routes>
            <Toast message={toast.message} isVisible={toast.isVisible} />
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, idToDelete: null, type: null })} onConfirm={confirmDelete} title={`${deleteModal.type} silməni təsdiqləyin`}><p>Bu {deleteModal.type} silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmazdır.</p></Modal>
            <PasscodeModal isOpen={isPasscodeModalOpen} onClose={() => setIsPasscodeModalOpen(false)} onConfirm={handlePasscodeConfirm} showToast={showToast} />
            <ModeSelectionModal isOpen={isModeSelectionModalOpen} onClose={() => setIsModeSelectionModalOpen(false)} onSelect={handleModeSelected} />
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportQuestions} showToast={showToast} />
            <AddFromBankModal isOpen={isAddFromBankModalOpen} onClose={() => setIsAddFromBankModalOpen(false)} onAdd={handleAddQuestionsFromBank} showToast={showToast} questionBank={questionBank} />
            <WavingCat />
        </> 
    );
}
