import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, TrophyIcon, GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon } from '../assets/icons';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Helper Functions ---
const isAnswerCorrect = (question, userAnswer) => {
    if (userAnswer === undefined || userAnswer === null) return false;
    if (!question || !question.type) return false;

    if (question.type === 'open') {
        return userAnswer?.score > 0;
    }
    if (question.type === 'single') return userAnswer === question.options[question.correctAnswers[0]];
    if (question.type === 'multiple') { const correct = question.correctAnswers.map(i => question.options[i]).sort(); const user = userAnswer ? [...userAnswer].sort() : []; return JSON.stringify(correct) === JSON.stringify(user); }
    if (question.type === 'textInput') return userAnswer && question.correctAnswers[0].trim().toLowerCase() === userAnswer.trim().toLowerCase();
    if (question.type === 'trueFalse') return userAnswer === question.correctAnswer;
    if (question.type === 'ordering') return JSON.stringify(userAnswer) === JSON.stringify(question.orderItems);
    return false;
};

const formatUserAnswer = (answer) => {
    if (answer === null || answer === undefined) return 'Cavab yoxdur';
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'object') return answer.answer || 'N/A'; // For graded 'open' questions
    return String(answer);
};

// --- Modal Component for showing responders ---
const QuestionRespondersModal = ({ isOpen, onClose, question, results }) => {
    const responders = useMemo(() => {
        if (!question || !results) return { correct: [], incorrect: [] };

        const correct = [];
        const incorrect = [];

        results.forEach(result => {
            const student = { id: result.user_id, name: `${result.userName} ${result.userSurname}` };
            const userAnswer = result.userAnswers[question.id];
            
            if (isAnswerCorrect(question, userAnswer)) {
                correct.push(student);
            } else {
                incorrect.push({ ...student, answer: formatUserAnswer(userAnswer) });
            }
        });

        return { correct, incorrect };
    }, [question, results]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Suala cavab verənlər: "${question.text}"`} size="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold text-green-600 mb-2 flex items-center gap-2"><CheckCircleIcon /> Düzgün cavab verənlər ({responders.correct.length})</h4>
                    <div className="max-h-64 overflow-y-auto bg-green-50 p-3 rounded-lg">
                        {responders.correct.length > 0 ? (
                            <ul className="space-y-2">
                                {responders.correct.map(s => <li key={s.id}><Link to={`/student/${s.id}`} className="text-blue-600 hover:underline">{s.name}</Link></li>)}
                            </ul>
                        ) : <p className="text-gray-500">Yoxdur</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2"><XCircleIcon /> Səhv cavab verənlər ({responders.incorrect.length})</h4>
                    <div className="max-h-64 overflow-y-auto bg-red-50 p-3 rounded-lg">
                        {responders.incorrect.length > 0 ? (
                            <ul className="space-y-2">
                                {responders.incorrect.map(s => (
                                    <li key={s.id}>
                                        <Link to={`/student/${s.id}`} className="text-blue-600 hover:underline">{s.name}</Link>
                                        <p className="text-xs text-gray-600 pl-2 border-l-2 border-red-200 ml-2 mt-1">Cavab: <span className="font-medium text-red-700">{s.answer}</span></p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-gray-500">Yoxdur</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const QuizAnalysisPage = ({ quizzes, results, allUsers }) => {
    const { quizId } = useParams();
    const [analyzingQuestion, setAnalyzingQuestion] = useState(null);

    const quiz = useMemo(() => quizzes.find(q => q.id === Number(quizId)), [quizzes, quizId]);
    const quizResults = useMemo(() => results.filter(r => r.quizId === Number(quizId) && r.status !== 'pending_review'), [results, quizId]);

    const analysis = useMemo(() => {
        if (!quiz || quizResults.length === 0) return null;

        const totalAttempts = quizResults.length;
        const averageScore = quizResults.reduce((acc, r) => acc + r.percentage, 0) / totalAttempts;
        const highestScore = Math.max(...quizResults.map(r => r.percentage));
        const lowestScore = Math.min(...quizResults.map(r => r.percentage));

        const scoreDistribution = Array(10).fill(0);
        quizResults.forEach(r => {
            const bracket = Math.floor(r.percentage / 10);
            if (bracket === 10) scoreDistribution[9]++;
            else scoreDistribution[bracket]++;
        });

        const questionAnalysis = (quiz.questions || []).map(q => {
            let correctCount = 0;
            quizResults.forEach(r => {
                if (isAnswerCorrect(q, r.userAnswers[q.id])) {
                    correctCount++;
                }
            });
            return { ...q, correctPercentage: (correctCount / totalAttempts) * 100 };
        });

        return { totalAttempts, averageScore, highestScore, lowestScore, scoreDistribution, questionAnalysis };

    }, [quiz, quizResults]);

    const quizLeaderboard = useMemo(() => {
        if (!quizResults || !allUsers) return [];

        const userBestScores = {};
        quizResults.forEach(result => {
            if (!userBestScores[result.user_id] || result.score > userBestScores[result.user_id].score) {
                userBestScores[result.user_id] = {
                    score: result.score,
                    percentage: result.percentage,
                    user_id: result.user_id
                };
            }
        });

        return Object.values(userBestScores)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(entry => {
                const userProfile = allUsers.find(u => u.id === entry.user_id);
                return {
                    ...entry,
                    name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Naməlum istifadəçi'
                };
            });
    }, [quizResults, allUsers]);

    if (!quiz) return <Card><p className="text-center">Test tapılmadı.</p></Card>;
    if (!analysis) return <Card><p className="text-center">Bu test üçün heç bir nəticə tapılmadı.</p></Card>;

    const distributionChartData = {
        labels: ['0-9%', '10-19%', '20-29%', '30-39%', '40-49%', '50-59%', '60-69%', '70-79%', '80-89%', '90-100%'],
        datasets: [{
            label: 'Tələbə sayı',
            data: analysis.scoreDistribution,
            backgroundColor: 'rgba(249, 115, 22, 0.6)',
            borderColor: 'rgba(249, 115, 22, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Test Analizi</h1>
                    <p className="text-lg text-gray-600">{quiz.title}</p>
                </div>
                <Link to="/stats"><Button variant="secondary"><ArrowLeftIcon /> Statistikaya qayıt</Button></Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="text-center"><h3 className="font-semibold">Cəhdlər</h3><p className="text-3xl font-bold text-orange-600">{analysis.totalAttempts}</p></Card>
                <Card className="text-center"><h3 className="font-semibold">Orta Nəticə</h3><p className="text-3xl font-bold text-blue-600">{analysis.averageScore.toFixed(1)}%</p></Card>
                <Card className="text-center"><h3 className="font-semibold">Ən Yüksək</h3><p className="text-3xl font-bold text-green-600">{analysis.highestScore}%</p></Card>
                <Card className="text-center"><h3 className="font-semibold">Ən Aşağı</h3><p className="text-3xl font-bold text-red-600">{analysis.lowestScore}%</p></Card>
            </div>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><TrophyIcon /> Bu Test üzrə Liderlər</h3>
                {quizLeaderboard.length > 0 ? (
                    <ol className="space-y-2">
                        {quizLeaderboard.map((user, index) => (
                            <li key={user.user_id} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                                    <span className="flex items-center gap-2">
                                        {index === 0 ? <GoldMedalIcon /> : index === 1 ? <SilverMedalIcon /> : index === 2 ? <BronzeMedalIcon /> : <TrophyIcon className="w-5 h-5 text-gray-400" />}
                                        <Link to={`/student/${user.user_id}`} className="font-semibold text-blue-600 hover:underline">{user.name}</Link>
                                    </span>
                                </div>
                                <span className="font-bold text-orange-500">{user.score} bal ({user.percentage}%)</span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-gray-500">Bu test üçün reytinq məlumatı yoxdur.</p>
                )}
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Nəticələrin Paylanması</h3>
                <div className="h-80"><Bar data={distributionChartData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} /></div>
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sualların Analizi</h3>
                <div className="space-y-2">
                    {analysis.questionAnalysis.map((q, index) => (
                        <button key={q.id} onClick={() => setAnalyzingQuestion(q)} className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-orange-50 transition">
                            <p className="font-semibold">{index + 1}. {q.text}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                        className="h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${q.correctPercentage}%`, backgroundColor: q.correctPercentage > 60 ? '#22C55E' : q.correctPercentage > 30 ? '#F59E0B' : '#EF4444' }}
                                    ></div>
                                </div>
                                <span className="font-bold text-sm w-16 text-right" style={{ color: q.correctPercentage > 60 ? '#16A34A' : q.correctPercentage > 30 ? '#D97706' : '#DC2626' }}>{q.correctPercentage.toFixed(1)}%</span>
                            </div>
                             <p className="text-xs text-gray-500 mt-1">düzgün cavab verdi</p>
                        </button>
                    ))}
                </div>
            </Card>
            <QuestionRespondersModal isOpen={!!analyzingQuestion} onClose={() => setAnalyzingQuestion(null)} question={analyzingQuestion} results={quizResults} />
        </div>
    );
};

export default QuizAnalysisPage;
