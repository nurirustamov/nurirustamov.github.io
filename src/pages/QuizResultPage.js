import React, { useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, EyeIcon, TrophyIcon } from '../assets/icons';

const QuizResultPage = ({ lastResult, allResultsForThisQuiz, onBack, onReview }) => {
    const {
        score,
        totalPoints,
        correctAnswersCount,
        totalQuestions,
        userName,
        userSurname,
        id: resultId
    } = lastResult;

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    const { rank, totalParticipants } = useMemo(() => {
        const sortedResults = [...allResultsForThisQuiz].sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date));
        const rank = sortedResults.findIndex(r => r.id === resultId) + 1;
        return { rank, totalParticipants: allResultsForThisQuiz.length };
    }, [allResultsForThisQuiz, resultId]);

    let message = '';
    let messageColor = 'text-gray-800';

    if (percentage === 100) {
        message = 'Əla! Bütün suallara düzgün cavab verdiniz!';
        messageColor = 'text-green-600';
    } else if (percentage >= 75) {
        message = 'Yaxşı işdir! Siz əla bacardınız.';
        messageColor = 'text-blue-600';
    } else if (percentage >= 50) {
        message = 'Pis deyil, amma daha yaxşı ola bilər.';
        messageColor = 'text-yellow-600';
    } else {
        message = 'Yenidən cəhd etməyə dəyər.';
        messageColor = 'text-red-600';
    }

    // Увеличенные параметры для круга
    const radius = 70;
    const strokeWidth = 14;
    const viewBoxSize = 180;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="animate-fade-in text-center">
            <Card className="p-4 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Testin Nəticələri</h1>
                {userName && <p className="text-lg text-gray-600 mt-2">Nəticələr: {userName} {userSurname}</p>}
                
                <div className="my-6 sm:my-8 relative inline-flex items-center justify-center">
                    <svg className="w-48 h-48" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                        <circle className="text-gray-200" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={viewBoxSize/2} cy={viewBoxSize/2} />
                        <circle
                            className="text-orange-500"
                            strokeWidth={strokeWidth}
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx={viewBoxSize/2}
                            cy={viewBoxSize/2}
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset,
                                transition: 'stroke-dashoffset 0.8s ease-out'
                            }}
                            transform={`rotate(-90 ${viewBoxSize/2} ${viewBoxSize/2})`}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl sm:text-5xl font-bold text-orange-500">{percentage}%</span>
                        <span className="text-lg text-gray-600 mt-1">{score} / {totalPoints} bal</span>
                        <span className="text-sm text-gray-500 mt-1">({correctAnswersCount} / {totalQuestions} düzgün)</span>
                    </div>
                </div>

                {rank > 0 && totalParticipants > 0 && (
                    <div className="mb-8">
                        <div className="inline-flex items-center bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-full">
                            <TrophyIcon className="w-6 h-6 mr-2" />
                            <span>Sizin bu test üzrə reytinqiniz: {totalParticipants} iştirakçı arasında <strong>{rank}-ci yer</strong></span>
                        </div>
                    </div>
                )}

                <p className={`text-lg sm:text-xl font-semibold ${messageColor} mb-8`}>{message}</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    <Button onClick={onBack} variant="secondary" className="w-full sm:w-auto">
                        <ArrowLeftIcon />
                        Siyahıya qayıt
                    </Button>
                    <Button onClick={onReview} className="w-full sm:w-auto">
                        <EyeIcon />
                        Cavablara bax
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default QuizResultPage;