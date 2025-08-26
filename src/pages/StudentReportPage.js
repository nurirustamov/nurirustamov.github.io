import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '../assets/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StudentReportPage = ({ results }) => {
    const { studentSlug } = useParams();

    const studentResults = useMemo(() => {
        return results
            .filter(r => `${r.userName}-${r.userSurname}`.toLowerCase() === studentSlug)
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending for the chart
    }, [results, studentSlug]);

    const studentName = studentResults.length > 0 ? `${studentResults[0].userName} ${studentResults[0].userSurname}` : '';

    const averageScore = useMemo(() => {
        if (studentResults.length === 0) return 0;
        const totalPercentage = studentResults.reduce((acc, r) => acc + r.percentage, 0);
        return totalPercentage / studentResults.length;
    }, [studentResults]);

    const chartData = useMemo(() => {
        return {
            labels: studentResults.map(r => `${r.quizTitle} (${new Date(r.date).toLocaleDateString('az-AZ')})`),
            datasets: [
                {
                    label: 'Nəticə (%)',
                    data: studentResults.map(r => r.percentage),
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    fill: true,
                    tension: 0.1
                }
            ]
        };
    }, [studentResults]);

    if (studentResults.length === 0) {
        return (
            <Card className="text-center">
                <p className="text-red-500">Bu tələbə üçün nəticə tapılmadı.</p>
                <Link to="/stats">
                    <Button variant="secondary" className="mt-4">Statistikaya qayıt</Button>
                </Link>
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
                <Link to="/stats">
                    <Button variant="secondary"><ArrowLeftIcon /> <span className="hidden sm:inline">Statistikaya qayıt</span></Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Ümumi Göstəricilər</h3>
                    <p><strong>Orta Nəticə:</strong> {averageScore.toFixed(1)}%</p>
                    <p><strong>Tamamlanmış Testlər:</strong> {studentResults.length}</p>
                </Card>
                <Card className="lg:col-span-2">
                     <h3 className="text-lg font-bold text-gray-800 mb-4">İnkişaf Dinamikası</h3>
                     <div className="h-48">
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                     </div>
                </Card>
            </div>

            <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Bütün Nəticələr</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Adı</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nəticə</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faiz</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarix</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentResults.sort((a, b) => new Date(b.date) - new Date(a.date)).map(result => (
                                <tr key={result.id}>
                                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{result.quizTitle}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{result.score} / {result.totalPoints} bal</span>
                                            <span className="text-xs text-gray-400">({result.correctAnswersCount} / {result.totalQuestions} düzgün)</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{result.percentage}%</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(result.date).toLocaleDateString('az-AZ')}</td>
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