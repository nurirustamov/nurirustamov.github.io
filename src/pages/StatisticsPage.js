import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, DownloadIcon, TrophyIcon, GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon } from '../assets/icons';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const isAnswerCorrect = (question, userAnswer) => {
    if (userAnswer === undefined) return false;
    switch (question.type) {
        case 'single': return userAnswer === question.options[question.correctAnswers[0]];
        case 'multiple':
            const correctOptions = question.correctAnswers.map(i => question.options[i]).sort();
            const userOptions = userAnswer ? [...userAnswer].sort() : [];
            return JSON.stringify(correctOptions) === JSON.stringify(userOptions);
        case 'textInput': return userAnswer.trim().toLowerCase() === question.correctAnswers[0].trim().toLowerCase();
        case 'trueFalse': return userAnswer === question.correctAnswer;
        case 'ordering': return JSON.stringify(userAnswer) === JSON.stringify(question.orderItems);
        default: return false;
    }
};

const StatisticsPage = ({ results, onBack, quizzes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuizFilter, setSelectedQuizFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    const filteredResults = useMemo(() => {
        let filtered = results;
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.userName.toLowerCase().includes(lowerCaseSearchTerm) ||
                r.userSurname.toLowerCase().includes(lowerCaseSearchTerm) ||
                r.quizTitle.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }
        if (selectedQuizFilter !== 'all') {
            filtered = filtered.filter(r => r.quizTitle === selectedQuizFilter);
        }
        return filtered;
    }, [results, searchTerm, selectedQuizFilter]);

    const analytics = useMemo(() => {
        const data = filteredResults;
        if (data.length === 0) return null;

        const totalCompletions = data.length;
        const uniqueStudents = new Set(data.map(r => `${r.userName} ${r.userSurname}`)).size;
        const averageScore = data.reduce((acc, r) => acc + r.percentage, 0) / totalCompletions;

        const scoreDistribution = {
            perfect: data.filter(r => r.percentage === 100).length,
            good: data.filter(r => r.percentage >= 70 && r.percentage < 100).length,
            medium: data.filter(r => r.percentage >= 50 && r.percentage < 70).length,
            bad: data.filter(r => r.percentage < 50).length,
        };

        const difficultQuestions = {};
        data.forEach(result => {
            const quiz = quizzes.find(q => q.id === result.quizId);
            if (!quiz) return;

            result.questionOrder.forEach(q => {
                const originalQuestion = quiz.questions.find(oq => oq.id === q.id);
                if (!originalQuestion) return;

                const userAnswer = result.userAnswers[originalQuestion.id];
                if (!isAnswerCorrect(originalQuestion, userAnswer)) {
                    if (!difficultQuestions[originalQuestion.text]) {
                        difficultQuestions[originalQuestion.text] = { count: 0, quizTitle: quiz.title };
                    }
                    difficultQuestions[originalQuestion.text].count++;
                }
            });
        });

        const topDifficultQuestions = Object.entries(difficultQuestions)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5);

        return { totalCompletions, uniqueStudents, averageScore, scoreDistribution, topDifficultQuestions };
    }, [filteredResults, quizzes]);

    const leaderboardData = useMemo(() => {
        const resultsByQuiz = filteredResults.reduce((acc, result) => {
            acc[result.quizTitle] = acc[result.quizTitle] || [];
            acc[result.quizTitle].push(result);
            return acc;
        }, {});

        return Object.entries(resultsByQuiz).map(([quizTitle, quizResults]) => {
            const bestScores = {};
            quizResults.forEach(result => {
                const studentIdentifier = `${result.userName} ${result.userSurname}`;
                if (!bestScores[studentIdentifier] || result.score > bestScores[studentIdentifier].score) {
                    bestScores[studentIdentifier] = result;
                }
            });

            const topStudents = Object.values(bestScores)
                .sort((a, b) => b.score - a.score || a.date - b.date)
                .slice(0, 5);

            return { quizTitle, topStudents };
        });
    }, [filteredResults]);

    const pieChartData = useMemo(() => {
        if (!analytics) return null;
        return {
            labels: [`Əla (90-100%)`, `Yaxşı (70-89%)`, `Kafi (50-69%)`, `Qeyri-kafi (0-49%)`],
            datasets: [{
                data: [analytics.scoreDistribution.perfect, analytics.scoreDistribution.good, analytics.scoreDistribution.medium, analytics.scoreDistribution.bad],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
                borderColor: ['#ffffff'],
                borderWidth: 2,
            }]
        };
    }, [analytics]);

    const uniqueQuizTitles = useMemo(() => {
        const titles = new Set(results.map(r => r.quizTitle));
        return ['all', ...Array.from(titles).sort()];
    }, [results]);

    const sortedResults = useMemo(() => {
        return [...filteredResults].sort((a, b) => {
            let compareValue = 0;
            if (sortBy === 'date') compareValue = new Date(b.date).getTime() - new Date(a.date).getTime();
            else if (sortBy === 'name') compareValue = `${a.userName} ${a.userSurname}`.localeCompare(`${b.userName} ${b.userSurname}`);
            else if (sortBy === 'quizTitle') compareValue = a.quizTitle.localeCompare(b.quizTitle);
            else if (sortBy === 'percentage') compareValue = b.percentage - a.percentage;
            else if (sortBy === 'score') compareValue = a.score - b.score;
            return sortDirection === 'asc' ? compareValue : -compareValue;
        });
    }, [filteredResults, sortBy, sortDirection]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (column) => (sortBy === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '');

    const handleExportCSV = () => {
        const headers = ["Reytinq", "Ad", "Soyad", "Test Adı", "Toplanan Bal", "Maksimum Bal", "Düzgün Cavab Sayı", "Ümumi Sual Sayı", "Faiz", "Tarix"];
        const csvRows = [headers.join(',')];
        sortedResults.forEach((result, index) => {
            const row = [index + 1, `"${result.userName}"`, `"${result.userSurname}"`, `"${result.quizTitle}"`, result.score, result.totalPoints, result.correctAnswersCount, result.totalQuestions, result.percentage, new Date(result.date).toLocaleDateString('az-AZ')];
            csvRows.push(row.join(','));
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'statistika.csv';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getMedalIcon = (index) => {
        if (index === 0) return <GoldMedalIcon />;
        if (index === 1) return <SilverMedalIcon />;
        if (index === 2) return <BronzeMedalIcon />;
        return <TrophyIcon className="text-gray-300" />;
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Statistika Paneli</h1>
                <Button onClick={onBack} variant="secondary"><ArrowLeftIcon /> <span className="hidden sm:inline">Geri</span></Button>
            </div>

            <Card className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="Ada və ya testə görə axtarış..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" />
                    <select value={selectedQuizFilter} onChange={e => setSelectedQuizFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md bg-white flex-1 md:flex-none">
                        {uniqueQuizTitles.map(title => <option key={title} value={title}>{title === 'all' ? 'Bütün Testlər' : title}</option>)}
                    </select>
                    <Button onClick={handleExportCSV} variant="secondary" disabled={sortedResults.length === 0}><DownloadIcon /> <span className="hidden sm:inline">CSV ixrac et</span></Button>
                </div>
            </Card>

            {analytics ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1"><h3 className="font-bold text-lg mb-4">Ümumi Göstəricilər</h3><div className="space-y-3"><p><strong>Testi Tamamlayanlar:</strong> {analytics.totalCompletions}</p><p><strong>Unikal Tələbələr:</strong> {analytics.uniqueStudents}</p><p><strong>Orta Nəticə:</strong> {analytics.averageScore.toFixed(1)}%</p></div></Card>
                        <Card className="lg:col-span-2"><h3 className="font-bold text-lg mb-4">Nəticələrin Paylanması</h3><div className="h-64 flex items-center justify-center">{pieChartData && <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />}</div></Card>
                    </div>
                    
                    <Card>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><TrophyIcon /> Liderlər Lövhəsi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {leaderboardData.map(({ quizTitle, topStudents }) => (
                                <div key={quizTitle} className="border rounded-lg p-4">
                                    <h4 className="font-semibold text-center mb-3">{quizTitle}</h4>
                                    <ol className="space-y-2">
                                        {topStudents.map((student, index) => (
                                            <li key={student.id} className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2">
                                                    {getMedalIcon(index)}
                                                    <Link to={`/student/${student.userName}-${student.userSurname}`.toLowerCase()} className="hover:underline">{student.userName} {student.userSurname}</Link>
                                                </span>
                                                <span className="font-bold">{student.score} bal</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="lg:col-span-3"><h3 className="font-bold text-lg mb-4">Ən Çətin Suallar (Ən çox səhv cavablananlar)</h3><ol className="list-decimal list-inside space-y-2">{analytics.topDifficultQuestions.length > 0 ? (analytics.topDifficultQuestions.map(([text, data]) => <li key={text}><strong>{text}</strong> ({data.quizTitle}) - <span className="text-red-600">{data.count} səhv</span></li>)) : (<p>Səhv cavab tapılmadı.</p>)}</ol></Card>
                </div>
            ) : (<Card><p className="text-center text-gray-500 py-8">Statistika üçün kifayət qədər məlumat yoxdur.</p></Card>)}

            <Card>
                <h2 className="text-xl font-bold mb-4">Bütün Nəticələr</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>Reytinq {getSortIndicator('date')}</th><th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>Ad Soyad {getSortIndicator('name')}</th><th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('quizTitle')}>Test {getSortIndicator('quizTitle')}</th><th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('score')}>Nəticə {getSortIndicator('score')}</th><th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('percentage')}>Faiz {getSortIndicator('percentage')}</th><th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>Tarix {getSortIndicator('date')}</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedResults.map((result, index) => {
                                const studentSlug = `${result.userName}-${result.userSurname}`.toLowerCase();
                                return (
                                    <tr key={result.id}>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900"><Link to={`/student/${studentSlug}`} className="text-blue-600 hover:underline">{result.userName} {result.userSurname}</Link></td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{result.quizTitle}</td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500"><div className="flex flex-col"><span className="font-bold">{result.score} / {result.totalPoints} bal</span><span className="text-xs text-gray-400">({result.correctAnswersCount} / {result.totalQuestions} düzgün)</span></div></td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{result.percentage}%</td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(result.date).toLocaleDateString('az-AZ')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default StatisticsPage;