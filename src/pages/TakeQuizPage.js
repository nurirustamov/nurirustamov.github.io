import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import OrderingQuestion from '../components/OrderingQuestion';
import { SpeakerIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '../assets/icons';

const TakeQuizPage = ({ quiz, user, onSubmit }) => {
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState((quiz.timeLimit || 10) * 60);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

    useEffect(() => {
        if (timeLeft <= 0) { onSubmit(answers, quizQuestions); return; }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, answers, onSubmit, quizQuestions]);

    const handleAnswerChange = (questionId, answer) => setAnswers(prev => ({ ...prev, [questionId]: answer }));
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${('0' + seconds % 60).slice(-2)}`;
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'az-AZ'; // Изменен язык на азербайджанский
            window.speechSynthesis.speak(utterance);
        } else { alert('Sizin brauzeriniz mətni səsləndirməyi dəstəkləmir.'); }
    };

    const q = quizQuestions[currentQuestionIndex];
    if (!q) return <Card><p>Bu testdə hələlik sual yoxdur.</p></Card>;
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    const optionsForCurrentQuestion = quiz.shuffleOptions && shuffledOptions[q.id] ? shuffledOptions[q.id] : q.options;

    return (
        <div className="animate-fade-in">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-orange-600 text-center sm:text-left">{quiz.title}</h1>
                    <div className="text-2xl font-bold text-orange-500 bg-orange-100 px-4 py-2 rounded-lg w-full sm:w-auto text-center">{formatTime(timeLeft)}</div>
                </div>
                {user && <p className="text-center sm:text-left text-gray-600 mb-4">Uğurlar, {user.name}!</p>}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
                
                <div key={q.id} className="bg-orange-50 p-4 sm:p-6 rounded-lg">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-4 flex-1">{currentQuestionIndex + 1}. {q.text}</h3>
                        <button onClick={() => speakText(q.text)} className="text-gray-500 hover:text-orange-500 ml-2 sm:ml-4 p-2"><SpeakerIcon /></button>
                    </div>
                    {q.imageUrl && <img src={q.imageUrl} alt="Question illustration" className="my-4 rounded-lg max-h-60 w-full object-contain mx-auto" onError={(e) => e.target.style.display = 'none'} />}
                    
                    {q.type === 'single' && optionsForCurrentQuestion.map((option, optIndex) => (
                        <div key={optIndex} className="mb-2"><label className="block p-3 rounded-lg hover:bg-orange-100 cursor-pointer border-2 border-transparent has-[:checked]:bg-orange-100 has-[:checked]:border-orange-300"><input type="radio" name={q.id} value={option} checked={answers[q.id] === option} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500" />{option}</label></div>
                    ))}
                    {q.type === 'multiple' && optionsForCurrentQuestion.map((option, optIndex) => (
                        <div key={optIndex} className="mb-2"><label className="block p-3 rounded-lg hover:bg-orange-100 cursor-pointer border-2 border-transparent has-[:checked]:bg-orange-100 has-[:checked]:border-orange-300"><input type="checkbox" name={q.id} value={option} checked={answers[q.id]?.includes(option)} onChange={(e) => { const curr = answers[q.id] || []; const next = e.target.checked ? [...curr, e.target.value] : curr.filter(a => a !== e.target.value); handleAnswerChange(q.id, next); }} className="mr-3 h-4 w-4 text-orange-600 rounded focus:ring-orange-500" />{option}</label></div>
                    ))}
                    {q.type === 'textInput' && <input type="text" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3" placeholder="Cavabınızı daxil edin..." />}
                    {q.type === 'trueFalse' && (
                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <label className="block p-3 rounded-lg hover:bg-orange-100 cursor-pointer flex-1 text-center border-2 border-transparent has-[:checked]:bg-orange-100 has-[:checked]:border-orange-300"><input type="radio" name={q.id} checked={answers[q.id] === true} onChange={() => handleAnswerChange(q.id, true)} className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500" /> Doğru</label>
                            <label className="block p-3 rounded-lg hover:bg-orange-100 cursor-pointer flex-1 text-center border-2 border-transparent has-[:checked]:bg-orange-100 has-[:checked]:border-orange-300"><input type="radio" name={q.id} checked={answers[q.id] === false} onChange={() => handleAnswerChange(q.id, false)} className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500" /> Yanlış</label>
                        </div>
                    )}
                    {q.type === 'ordering' && <OrderingQuestion question={q} onAnswer={(orderedItems) => handleAnswerChange(q.id, orderedItems)} />}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0} variant="secondary" className="w-full sm:w-auto"><ArrowLeftIcon /> Geri</Button>
                    <span className="text-gray-600 font-medium order-first sm:order-none">{currentQuestionIndex + 1} / {quizQuestions.length}</span>
                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                        <Button onClick={() => setCurrentQuestionIndex(i => i + 1)} className="w-full sm:w-auto">İrəli <ArrowRightIcon /></Button>
                    ) : (
                        <Button onClick={() => onSubmit(answers, quizQuestions)} className="w-full sm:w-auto"><CheckIcon /> Bitir</Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TakeQuizPage;