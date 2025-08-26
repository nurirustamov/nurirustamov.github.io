import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, LightbulbIcon } from '../assets/icons';

const PastQuizReviewPage = ({ result, quiz }) => {

    if (!result || !quiz) {
        return (
            <Card className="text-center">
                <p className="text-red-500">Nəticə və ya test məlumatı tapılmadı.</p>
                <Link to="/stats">
                    <Button variant="secondary" className="mt-4">Statistikaya qayıt</Button>
                </Link>
            </Card>
        );
    }

    const studentName = `${result.userName} ${result.userSurname}`;

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
                    Cavabların təhlili: {quiz.title}
                </h1>
                <Link to={`/student/${result.userName.toLowerCase()}-${result.userSurname.toLowerCase()}`}>
                    <Button variant="secondary"><ArrowLeftIcon /> Tələbənin hesabatına qayıt</Button>
                </Link>
            </div>
            <Card>
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <div>
                        <p><strong>Tələbə:</strong> {studentName}</p>
                        <p><strong>Tarix:</strong> {new Date(result.date).toLocaleString('az-AZ')}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Nəticə:</strong> {result.percentage}%</p>
                        <p><strong>Bal:</strong> {result.score} / {result.totalPoints}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {result.questionOrder.map((q, index) => {
                        const originalQuestion = quiz.questions.find(origQ => origQ.id === q.id);
                        if (!originalQuestion) return (
                            <div key={q.id} className="p-3 sm:p-4 rounded-lg bg-gray-100 border-l-4 border-gray-400">
                                <p className="text-gray-600">Bu sual testdən silinib.</p>
                            </div>
                        );

                        const userAnswer = result.userAnswers[q.id];
                        let isCorrect = false;
                        let correctAnswerText = '';

                        if (originalQuestion.type === 'single') { isCorrect = userAnswer === originalQuestion.options[originalQuestion.correctAnswers[0]]; correctAnswerText = originalQuestion.options[originalQuestion.correctAnswers[0]]; }
                        else if (originalQuestion.type === 'multiple') { const correct = originalQuestion.correctAnswers.map(i => originalQuestion.options[i]).sort(); const user = userAnswer ? [...userAnswer].sort() : []; isCorrect = JSON.stringify(correct) === JSON.stringify(user); correctAnswerText = correct.join(', '); }
                        else if (originalQuestion.type === 'textInput') { isCorrect = userAnswer && originalQuestion.correctAnswers[0].toLowerCase() === userAnswer.toLowerCase(); correctAnswerText = originalQuestion.correctAnswers[0]; }
                        else if (originalQuestion.type === 'trueFalse') { isCorrect = userAnswer === originalQuestion.correctAnswer; correctAnswerText = originalQuestion.correctAnswer ? 'Doğru' : 'Yanlış'; }
                        else if (originalQuestion.type === 'ordering') { isCorrect = JSON.stringify(userAnswer) === JSON.stringify(originalQuestion.orderItems); correctAnswerText = originalQuestion.orderItems.map((item, i) => `${i + 1}. ${item}`).join('; '); }

                        const userAnswerDisplay = Array.isArray(userAnswer) ? userAnswer.join(', ') : String(userAnswer ?? 'Cavab yoxdur');

                        return (
                            <div key={q.id} className={`p-3 sm:p-4 rounded-lg ${isCorrect ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
                                <div className="flex items-start">
                                    <span className={`mr-3 mt-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{isCorrect ? <CheckCircleIcon /> : <XCircleIcon />}</span>
                                    <h3 className="font-semibold text-base sm:text-lg text-gray-800 flex-1">{index + 1}. {originalQuestion.text}</h3>
                                </div>
                                
                                {originalQuestion.imageUrl && (
                                    <div className="pl-8 mt-3"><img src={originalQuestion.imageUrl} alt="Question illustration" className="rounded-lg max-h-40 sm:max-h-60 w-auto mx-auto" onError={(e) => e.target.style.display = 'none'} /></div>
                                )}

                                <div className="mt-3 pl-8 space-y-2 text-sm sm:text-base">
                                    <p><strong>Tələbənin cavabı:</strong> <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>{userAnswerDisplay}</span></p>
                                    {!isCorrect && <p><strong>Düzgün cavab:</strong> <span className="text-green-700 font-medium">{correctAnswerText}</span></p>}
                                </div>

                                {originalQuestion.explanation && (
                                    <div className="mt-4 pt-3 pl-8 border-t border-gray-300/70">
                                        <div className="flex items-start text-sm text-blue-800">
                                            <span className="mr-2 mt-1 flex-shrink-0"><LightbulbIcon /></span>
                                            <div><strong className="font-semibold">İzah:</strong><p className="mt-1 whitespace-pre-wrap">{originalQuestion.explanation}</p></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default PastQuizReviewPage;