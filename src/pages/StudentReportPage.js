import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, TrophyIcon, ArrowUpIcon, ArrowDownIcon } from '../assets/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleString('az-AZ');
};

const StudentReportPage = ({ results, onReviewResult }) => {
    const { userId } = useParams(); // Используем userId вместо studentSlug

    const studentResults = useMemo(() => {
        return results
            .filter(r => r.user_id === userId) // Фильтруем по уникальному user_id
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, [results, userId]);

    const studentName = studentResults.length > 0 ? `${studentResults[0].userName} ${studentResults[0].userSurname}` : '';

    const analytics = useMemo(() => {
        if (studentResults.length === 0) return null;

        const totalPercentage = studentResults.reduce((acc, r) => acc + r.percentage, 0);
        const averageScore = totalPercentage / studentResults.length;

        const bestPerf = [...studentResults].sort((a, b) => b.percentage - a.percentage)[0];
        const worstPerf = [...studentResults].sort((a, b) => a.percentage - b.percentage)[0];

        const quizAverages = studentResults.map(studentResult => {
            const allResultsForQuiz = results.filter(r => r.quizId === studentResult.quizId && r.status !== 'pending_review');
            if (allResultsForQuiz.length === 0) return 0;
            const total = allResultsForQuiz.reduce((acc, r) => acc + r.percentage, 0);
            return total / allResultsForQuiz.length;
        });

        return { averageScore, bestPerf, worstPerf, quizAverages };
    }, [studentResults, results]);

    const chartData = useMemo(() => {
        if (!analytics) return null;
        return {
            labels: studentResults.map(r => `${r.quizTitle} (${formatDate(r.created_at)})`),
            datasets: [
                {
                    label: 'Tələbənin Nəticəsi (%)',
                    data: studentResults.map(r => r.percentage),
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    fill: true,
                    tension: 0.2
                },
                {
                    label: 'Testin Orta Nəticəsi (%)',
                    data: analytics.quizAverages,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                    tension: 0.2
                }
            ]
        };
    }, [studentResults, analytics]);

    if (studentResults.length === 0) {
        return (
            <Card className="text-center">
                <p className="text-red-500">Bu tələbə üçün nəticə tapılmadı.</p>
                <Link to="/stats"><Button variant="secondary" className="mt-4">Statistikaya qayıt</Button></Link>
            </Card>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Tələbə Hesabatı</h1>
                    <p className="text-lg text-gray-600">{studentName}</p>
                </div>
                <Link to="/stats"><Button variant="secondary"><ArrowLeftIcon /> <span className="hidden sm:inline">Statistikaya qayıt</span></Button></Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Orta Nəticə</h3>
                    <p className="text-4xl font-bold text-orange-500">{analytics.averageScore.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">({studentResults.length} test əsasında)</p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Ən Yaxşı Nəticə</h3>
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
                        <ArrowUpIcon />
                        <span>{analytics.bestPerf.percentage}%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">({analytics.bestPerf.quizTitle})</p>
                </Card>
                <Card className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Ən Zəif Nəticə</h3>
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-600">
                        <ArrowDownIcon />
                        <span>{analytics.worstPerf.percentage}%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">({analytics.worstPerf.quizTitle})</p>
                </Card>
            </div>

            <Card>
                 <h3 className="text-lg font-bold text-gray-800 mb-4">İnkişaf Dinamikası</h3>
                 <div className="h-80">
                    {chartData && <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
                 </div>
            </Card>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Bütün Nəticələr</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Adı</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nəticə</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarix</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(result => (
                                <tr key={result.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <button onClick={() => onReviewResult(result)} className="text-blue-600 hover:underline text-left">
                                            {result.quizTitle}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{result.score} / {result.totalPoints} bal ({result.percentage}%)</span>
                                            <span className="text-xs text-gray-400">({result.correctAnswersCount}/{result.totalQuestions} düzgün)</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(result.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default StudentReportPage;