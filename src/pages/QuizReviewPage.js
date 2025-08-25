import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, LightbulbIcon } from '../assets/icons';

const QuizReviewPage = ({ quiz, userAnswers, questionOrder, onBack }) => (
    <div className="animate-fade-in">
        <Button onClick={onBack} variant="secondary" className="mb-6">
            <ArrowLeftIcon />
            <span className="hidden sm:inline">Nəticələrə qayıt</span>
            <span className="sm:hidden">Geri</span>
        </Button>
        <Card>
            <h1 className="text-xl sm:text-2xl font-bold text-center text-orange-600 mb-6 sm:mb-8">
                Cavabların təhlili: {quiz.title}
            </h1>
            <div className="space-y-6">
                {questionOrder.map((q, index) => {
                    const userAnswer = userAnswers[q.id];
                    let isCorrect = false;
                    let correctAnswerText = '';

                    if (q.type === 'single') { isCorrect = userAnswer === q.options[q.correctAnswers[0]]; correctAnswerText = q.options[q.correctAnswers[0]]; }
                    else if (q.type === 'multiple') { const correct = q.correctAnswers.map(i => q.options[i]).sort(); const user = userAnswer ? [...userAnswer].sort() : []; isCorrect = JSON.stringify(correct) === JSON.stringify(user); correctAnswerText = correct.join(', '); }
                    else if (q.type === 'textInput') { isCorrect = userAnswer && q.correctAnswers[0].toLowerCase() === userAnswer.toLowerCase(); correctAnswerText = q.correctAnswers[0]; }
                    else if (q.type === 'trueFalse') { isCorrect = userAnswer === q.correctAnswer; correctAnswerText = q.correctAnswer ? 'Doğru' : 'Yanlış'; }
                    else if (q.type === 'ordering') { isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.orderItems); correctAnswerText = q.orderItems.map((item, i) => `${i + 1}. ${item}`).join('; '); }

                    const userAnswerDisplay = Array.isArray(userAnswer) ? userAnswer.join(', ') : String(userAnswer ?? 'Cavab yoxdur');

                    return (
                        <div key={q.id} className={`p-3 sm:p-4 rounded-lg ${isCorrect ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
                            <div className="flex items-start">
                                <span className={`mr-3 mt-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                    {isCorrect ? <CheckCircleIcon /> : <XCircleIcon />}
                                </span>
                                <h3 className="font-semibold text-base sm:text-lg text-gray-800 flex-1">
                                    {index + 1}. {q.text}
                                </h3>
                            </div>
                            
                            {q.imageUrl && (
                                <div className="pl-8 mt-3">
                                    <img 
                                        src={q.imageUrl} 
                                        alt="Question illustration" 
                                        className="rounded-lg max-h-40 sm:max-h-60 w-auto mx-auto" 
                                        onError={(e) => e.target.style.display = 'none'} 
                                    />
                                </div>
                            )}

                            <div className="mt-3 pl-8 space-y-2 text-sm sm:text-base">
                                <p>
                                    <strong>Sizin cavabınız:</strong>{' '}
                                    <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                        {userAnswerDisplay}
                                    </span>
                                </p>
                                {!isCorrect && (
                                    <p>
                                        <strong>Düzgün cavab:</strong>{' '}
                                        <span className="text-green-700 font-medium">
                                            {correctAnswerText}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {q.explanation && (
                                <div className="mt-4 pt-3 pl-8 border-t border-gray-300/70">
                                    <div className="flex items-start text-sm text-blue-800">
                                        <span className="mr-2 mt-1 flex-shrink-0"><LightbulbIcon /></span>
                                        <div>
                                            <strong className="font-semibold">İzah:</strong>
                                            <p className="mt-1 whitespace-pre-wrap">{q.explanation}</p>
                                        </div>
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

export default QuizReviewPage;