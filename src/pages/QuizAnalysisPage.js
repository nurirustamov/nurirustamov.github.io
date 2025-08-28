import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ChartBarIcon } from '../assets/icons';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const QuizAnalysisPage = ({ quizzes, results }) => {
    const { quizId } = useParams();

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
            if (bracket === 10) scoreDistribution[9]++; // 100% falls into 90-100 bracket
            else scoreDistribution[bracket]++;
        });

        const questionAnalysis = (quiz.questions || []).map(q => {
            let correctCount = 0;
            quizResults.forEach(r => {
                const userAnswer = r.userAnswers[q.id];
                if (q.type === 'open') {
                    if (userAnswer?.score > 0) correctCount++;
                } else {
                    // Simplified isAnswerCorrect logic for analysis
                    let isCorrect = false;
                    if (q.type === 'single') isCorrect = userAnswer === q.options[q.correctAnswers[0]];
                    else if (q.type === 'multiple') { const correct = q.correctAnswers.map(i => q.options[i]).sort(); const user = userAnswer ? [...userAnswer].sort() : []; isCorrect = JSON.stringify(correct) === JSON.stringify(user); }
                    else if (q.type === 'textInput') isCorrect = userAnswer && q.correctAnswers[0].toLowerCase() === userAnswer.toLowerCase();
                    else if (q.type === 'trueFalse') isCorrect = userAnswer === q.correctAnswer;
                    else if (q.type === 'ordering') isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.orderItems);
                    if (isCorrect) correctCount++;
                }
            });
            return { ...q, correctPercentage: (correctCount / totalAttempts) * 100 };
        });

        return { totalAttempts, averageScore, highestScore, lowestScore, scoreDistribution, questionAnalysis };

    }, [quiz, quizResults]);

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
                <h3 className="text-lg font-bold text-gray-800 mb-4">Nəticələrin Paylanması</h3>
                <div className="h-80"><Bar data={distributionChartData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} /></div>
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sualların Analizi</h3>
                <div className="space-y-4">
                    {analysis.questionAnalysis.map((q, index) => (
                        <div key={q.id} className="p-4 rounded-lg bg-gray-50">
                            <p className="font-semibold">{index + 1}. {q.text}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div 
                                        className="bg-green-500 h-4 rounded-full"
                                        style={{ width: `${q.correctPercentage}%` }}
                                    ></div>
                                </div>
                                <span className="font-bold text-sm text-green-600">{q.correctPercentage.toFixed(1)}%</span>
                            </div>
                             <p className="text-xs text-gray-500 mt-1">düzgün cavab verdi</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default QuizAnalysisPage;