import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, EyeIcon } from '../assets/icons';

const QuizResultPage = ({ user, score, total, onBack, onReview }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
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

    const circumference = 2 * Math.PI * 54; // r="54"
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="animate-fade-in text-center">
            <Card className="p-4 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Testin Nəticələri</h1>
                {user && <p className="text-lg text-gray-600 mt-2">Nəticələr: {user.name} {user.surname}</p>}
                
                <div className="my-6 sm:my-8 relative inline-flex items-center justify-center">
                    <svg className="w-40 h-40" viewBox="0 0 160 160">
                        <circle className="text-gray-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="54" cx="80" cy="80" />
                        <circle
                            className="text-orange-500"
                            strokeWidth="12"
                            stroke="currentColor"
                            fill="transparent"
                            r="54"
                            cx="80"
                            cy="80"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset,
                                transition: 'stroke-dashoffset 0.8s ease-out'
                            }}
                            transform="rotate(-90 80 80)"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-3xl font-bold text-orange-500">{percentage}%</span>
                        <span className="text-lg text-gray-600 mt-1">{score} / {total}</span>
                    </div>
                </div>

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