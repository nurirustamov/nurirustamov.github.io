import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import OrderingQuestion from '../components/OrderingQuestion';
import { SpeakerIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, LightbulbIcon } from '../assets/icons';

// --- Helper Functions ---
const isAnswerCorrect = (question, userAnswer) => {
    if (userAnswer === undefined || userAnswer === null) return false;
    if (question.type === 'open') return false;
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

const speakText = (text) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'az-AZ';
        window.speechSynthesis.speak(utterance);
    } else { alert('Sizin brauzeriniz mətni səsləndirməyi dəstəkləmir.'); }
};

// --- Question Renderer Component ---
const QuestionRenderer = ({ q, index, answers, handleAnswerChange, isPracticeMode, isAnswerChecked, shuffledOptions, isSubmitting }) => {
    const optionsForCurrentQuestion = q.shuffleOptions && shuffledOptions[q.id] ? shuffledOptions[q.id] : q.options;

    const getOptionClassName = (option, optIndex) => {
        if (!isPracticeMode || !isAnswerChecked) return 'border-transparent';
        let isCorrect = false;
        if (q.type === 'single') isCorrect = optIndex === q.correctAnswers[0];
        if (q.type === 'multiple') isCorrect = q.correctAnswers.includes(optIndex);
        if (isCorrect) return 'border-green-500 bg-green-100';
        let isSelected = false;
        if (q.type === 'single') isSelected = answers[q.id] === option;
        if (q.type === 'multiple') isSelected = answers[q.id]?.includes(option);
        if (isSelected) return 'border-red-500 bg-red-100';
        return 'border-transparent';
    };

    return (
        <div key={q.id} className="bg-orange-50 p-4 sm:p-6 rounded-lg mb-6">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 flex-1">{index + 1}. {q.text}</h3>
                <button onClick={() => speakText(q.text)} className="text-gray-500 hover:text-orange-500 ml-2 sm:ml-4 p-2"><SpeakerIcon /></button>
            </div>
            {q.audioUrl && (
                <div className="my-4">
                    <audio controls src={q.audioUrl} className="w-full">Your browser does not support the audio element.</audio>
                </div>
            )}
            {q.imageUrl && <img src={q.imageUrl} alt="Question illustration" className="my-4 rounded-lg max-h-60 w-full object-contain mx-auto" onError={(e) => e.target.style.display = 'none'} />}
            
            {q.type === 'single' && optionsForCurrentQuestion.map((option, optIndex) => (
                <div key={optIndex} className="mb-2"><label className={`block p-3 rounded-lg hover:bg-orange-100 cursor-pointer border-2 ${getOptionClassName(option, optIndex)}`}><input type="radio" name={q.id} value={option} checked={answers[q.id] === option} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500" disabled={(isPracticeMode && isAnswerChecked) || isSubmitting} />{option}</label></div>
            ))}
            {q.type === 'multiple' && optionsForCurrentQuestion.map((option, optIndex) => (
                <div key={optIndex} className="mb-2"><label className={`block p-3 rounded-lg hover:bg-orange-100 cursor-pointer border-2 ${getOptionClassName(option, optIndex)}`}><input type="checkbox" name={q.id} value={option} checked={answers[q.id]?.includes(option)} onChange={(e) => { const curr = answers[q.id] || []; const next = e.target.checked ? [...curr, e.target.value] : curr.filter(a => a !== e.target.value); handleAnswerChange(q.id, next); }} className="mr-3 h-4 w-4 text-orange-600 rounded focus:ring-orange-500" disabled={(isPracticeMode && isAnswerChecked) || isSubmitting} />{option}</label></div>
            ))}
            {q.type === 'textInput' && <input type="text" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className={`mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 ${isPracticeMode && isAnswerChecked ? (isAnswerCorrect(q, answers[q.id]) ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : ''}`} placeholder="Cavabınızı daxil edin..." disabled={(isPracticeMode && isAnswerChecked) || isSubmitting} />}
            {q.type === 'trueFalse' && (
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <label className={`block p-3 rounded-lg hover:bg-orange-100 cursor-pointer flex-1 text-center border-2 ${isPracticeMode && isAnswerChecked && q.correctAnswer === true ? 'border-green-500 bg-green-100' : (isPracticeMode && isAnswerChecked && answers[q.id] === true ? 'border-red-500 bg-red-100' : 'border-transparent')}`}><input type="radio" name={q.id} checked={answers[q.id] === true} onChange={() => handleAnswerChange(q.id, true)} className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500" disabled={(isPracticeMode && isAnswerChecked) || isSubmitting} /> Doğru</label>
                    <label className={`block p-3 rounded-lg hover:bg-orange-100 cursor-pointer flex-1 text-center border-2 ${isPracticeMode && isAnswerChecked && q.correctAnswer === false ? 'border-green-500 bg-green-100' : (isPracticeMode && isAnswerChecked && answers[q.id] === false ? 'border-red-500 bg-red-100' : 'border-transparent')}`}><input type="radio" name={q.id} checked={answers[q.id] === false} onChange={() => handleAnswerChange(q.id, false)} className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500" disabled={(isPracticeMode && isAnswerChecked) || isSubmitting} /> Yanlış</label>
                </div>
            )}
            {q.type === 'ordering' && <OrderingQuestion question={q} onAnswer={(orderedItems) => handleAnswerChange(q.id, orderedItems)} disabled={(isPracticeMode && isAnswerChecked) || isSubmitting} />}
            {q.type === 'open' && (
                <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3"
                    placeholder="Cavabınızı bura daxil edin..."
                    rows="5"
                    disabled={(isPracticeMode && isAnswerChecked) || isSubmitting}
                />
            )}
            {isPracticeMode && isAnswerChecked && q.explanation && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400">
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
};

// --- Main Component ---
const TakeQuizPage = ({ quiz, user, onSubmit, mode = 'exam' }) => {
    const navigate = useNavigate();
    
    const [answers, setAnswers] = useState(() => {
        const initialState = {};
        (quiz.questions || []).forEach(q => {
            if (q.type === 'textInput' || q.type === 'open') {
                initialState[q.id] = '';
            }
        });
        return initialState;
    });

    const [timeLeft, setTimeLeft] = useState((quiz.timeLimit || 10) * 60);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    const isPracticeMode = mode === 'practice';
    const displayAll = quiz.display_all_questions && !isPracticeMode;

    const quizQuestions = useMemo(() => {
        return quiz.shuffleQuestions ? [...quiz.questions].sort(() => Math.random() - 0.5) : quiz.questions;
    }, [quiz]);

    const shuffledOptions = useMemo(() => {
        if (!quiz.shuffleOptions) return {};
        const shuffled = {};
        quizQuestions.forEach(q => {
            if (['single', 'multiple'].includes(q.type)) {
                shuffled[q.id] = [...q.options].sort(() => Math.random() - 0.5);
            }
        });
        return shuffled;
    }, [quizQuestions, quiz.shuffleOptions]);

    const handleSubmitQuiz = useCallback(() => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        if (onSubmit) {
            onSubmit(answers, quizQuestions);
        }
    }, [isSubmitting, onSubmit, answers, quizQuestions]);

    useEffect(() => {
        if (isPracticeMode) return;
        if (timeLeft <= 0) {
            handleSubmitQuiz();
            return;
        }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isPracticeMode, handleSubmitQuiz]);

    const handleAnswerChange = (questionId, answer) => {
        if (isPracticeMode && isAnswerChecked) return;
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleCheckAnswer = () => setIsAnswerChecked(true);
    const handleNextQuestion = () => {
        setIsAnswerChecked(false);
        setCurrentQuestionIndex(prev => prev + 1);
    };

    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${('0' + seconds % 60).slice(-2)}`;

    if (!quizQuestions || quizQuestions.length === 0) return <Card><p>Bu testdə hələlik sual yoxdur.</p></Card>;

    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
        <div className="animate-fade-in">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-orange-600 text-center sm:text-left">{quiz.title}</h1>
                    {!isPracticeMode && <div className="text-2xl font-bold text-orange-500 bg-orange-100 px-4 py-2 rounded-lg w-full sm:w-auto text-center">{formatTime(timeLeft)}</div>}
                    {isPracticeMode && <div className="text-lg font-bold text-blue-500 bg-blue-100 px-4 py-2 rounded-lg w-full sm:w-auto text-center">Məşq Rejimi</div>}
                </div>
                {!isPracticeMode && user && <p className="text-center sm:text-left text-gray-600 mb-4">Uğurlar, {user.first_name}!</p>}
                {!displayAll && !isPracticeMode && <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>}
                
                {displayAll ? (
                    quizQuestions.map((q, index) => (
                        <QuestionRenderer key={q.id} q={q} index={index} answers={answers} handleAnswerChange={handleAnswerChange} isPracticeMode={false} isAnswerChecked={false} shuffledOptions={shuffledOptions} isSubmitting={isSubmitting} />
                    ))
                ) : (
                    <QuestionRenderer q={quizQuestions[currentQuestionIndex]} index={currentQuestionIndex} answers={answers} handleAnswerChange={handleAnswerChange} isPracticeMode={isPracticeMode} isAnswerChecked={isAnswerChecked} shuffledOptions={shuffledOptions} isSubmitting={isSubmitting} />
                )}

                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                    {displayAll ? (
                        <Button onClick={handleSubmitQuiz} disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? 'Göndərilir...' : <><CheckIcon /> Testi Bitir</>}
                        </Button>
                    ) : isPracticeMode ? (
                        isAnswerChecked ? (
                            currentQuestionIndex < quizQuestions.length - 1 ? (
                                <Button onClick={handleNextQuestion} className="w-full sm:w-auto">Növbəti <ArrowRightIcon /></Button>
                            ) : (
                                <Button onClick={() => navigate('/')} className="w-full sm:w-auto"><CheckIcon /> Məşqi bitir</Button>
                            )
                        ) : (
                            <Button onClick={handleCheckAnswer} disabled={answers[quizQuestions[currentQuestionIndex].id] === undefined} className="w-full sm:w-auto">Yoxla</Button>
                        )
                    ) : (
                        <div className="w-full flex justify-between items-center">
                            <Button onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0 || isSubmitting} variant="secondary"><ArrowLeftIcon /> Geri</Button>
                            <span>{currentQuestionIndex + 1} / {quizQuestions.length}</span>
                            {currentQuestionIndex < quizQuestions.length - 1 ? (
                                <Button onClick={() => setCurrentQuestionIndex(i => i + 1)} disabled={isSubmitting}>İrəli <ArrowRightIcon /></Button>
                            ) : (
                                <Button onClick={handleSubmitQuiz} disabled={isSubmitting}>
                                    {isSubmitting ? 'Göndərilir...' : <><CheckIcon /> Bitir</>}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TakeQuizPage;
