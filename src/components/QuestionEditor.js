import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { TrashIcon, PlusIcon, DuplicateIcon, LightbulbIcon } from '../assets/icons';

const AnswerEditor = ({ question, onUpdate }) => {
    const handleOptionChange = (index, value) => {
        const newOptions = [...question.options];
        newOptions[index] = value;
        onUpdate({ ...question, options: newOptions });
    };
    const handleCorrectAnswerChange = (index) => {
        if (question.type === 'single') {
            onUpdate({ ...question, correctAnswers: [index] });
        } else {
            const newCorrect = question.correctAnswers.includes(index)
                ? question.correctAnswers.filter(i => i !== index)
                : [...question.correctAnswers, index];
            onUpdate({ ...question, correctAnswers: newCorrect });
        }
    };
    const handleCorrectTextAnswerChange = (e) => {
        onUpdate({ ...question, correctAnswers: [e.target.value] });
    };
    const handleTrueFalseChange = (value) => {
        onUpdate({ ...question, correctAnswer: value });
    };
    const addOption = () => {
        onUpdate({ ...question, options: [...question.options, ''] });
    };
    const removeOption = (index) => {
        const newOptions = question.options.filter((_, i) => i !== index);
        const newCorrect = question.correctAnswers
            .filter(i => i !== index)
            .map(i => (i > index ? i - 1 : i));
        onUpdate({ ...question, options: newOptions, correctAnswers: newCorrect });
    };
    const handleOrderItemChange = (index, value) => {
        const newItems = [...(question.orderItems || [])];
        newItems[index] = value;
        onUpdate({ ...question, orderItems: newItems });
    };
    const addOrderItem = () => {
        onUpdate({ ...question, orderItems: [...(question.orderItems || []), ''] });
    };
    const removeOrderItem = (index) => {
        const newItems = question.orderItems.filter((_, i) => i !== index);
        onUpdate({ ...question, orderItems: newItems });
    };

    switch (question.type) {
        case 'single':
        case 'multiple':
            return (
                <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Cavab variantları</h4>
                    <div className="space-y-2">
                        {question.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input type={question.type === 'single' ? 'radio' : 'checkbox'} name={`correctAnswer_${question.id}`} checked={question.correctAnswers.includes(idx)} onChange={() => handleCorrectAnswerChange(idx)} className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                                <input type="text" value={option} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Variant ${idx + 1}`} className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                                <button onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded-full"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={addOption} variant="secondary" className="mt-3 text-sm"><PlusIcon /> Variant əlavə et</Button>
                </div>
            );
        case 'textInput':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Düzgün cavab (hərf registri nəzərə alınmır)</label>
                    <input type="text" value={question.correctAnswers[0] || ''} onChange={handleCorrectTextAnswerChange} placeholder="Düzgün cavabı daxil edin" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
            );
        case 'trueFalse':
            return (
                <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer border-2 border-transparent has-[:checked]:bg-orange-100 has-[:checked]:border-orange-300"><input type="radio" name={`tf_${question.id}`} checked={question.correctAnswer === true} onChange={() => handleTrueFalseChange(true)} className="h-4 w-4 text-orange-600" /> <span className="ml-2">Doğru</span></label>
                    <label className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer border-2 border-transparent has-[:checked]:bg-orange-100 has-[:checked]:border-orange-300"><input type="radio" name={`tf_${question.id}`} checked={question.correctAnswer === false} onChange={() => handleTrueFalseChange(false)} className="h-4 w-4 text-orange-600" /> <span className="ml-2">Yanlış</span></label>
                </div>
            );
        case 'ordering':
             return (
                <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Sıralama üçün elementlər (düzgün ardıcıllıqla)</h4>
                    <div className="space-y-2">
                        {question.orderItems?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="text-gray-500 font-bold">{idx + 1}.</span>
                                <input type="text" value={item} onChange={(e) => handleOrderItemChange(idx, e.target.value)} placeholder={`Element ${idx + 1}`} className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                                <button onClick={() => removeOrderItem(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded-full"><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={addOrderItem} variant="secondary" className="mt-3 text-sm"><PlusIcon /> Element əlavə et</Button>
                </div>
            );
        case 'open': // Новый тип вопроса
            return (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm flex items-center gap-2">
                    <LightbulbIcon className="w-5 h-5" />
                    <span>Bu sualın cavabı müəllim tərəfindən manual olaraq yoxlanılacaq.</span>
                </div>
            );
        default: return null;
    }
};

const QuestionEditor = ({ question, index, onUpdate, onDelete, onDuplicate }) => {
    const [localQuestion, setLocalQuestion] = useState(question);

    useEffect(() => {
        setLocalQuestion(question);
    }, [question]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (JSON.stringify(localQuestion) !== JSON.stringify(question)) {
                onUpdate(localQuestion);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localQuestion, onUpdate, question]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? parseInt(value, 10) : value;
        setLocalQuestion(prev => ({ ...prev, [name]: processedValue }));
    };

    return (
        <div className="border border-gray-200 rounded-lg shadow-sm mb-6 bg-white relative">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="bg-orange-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">{index + 1}</span>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Sualın növü</label>
                        <select name="type" value={localQuestion.type} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm text-xs p-1">
                            <option value="single">Tək cavab</option>
                            <option value="multiple">Bir neçə cavab</option>
                            <option value="textInput">Mətn daxil etmə</option>
                            <option value="trueFalse">Doğru/Yanlış</option>
                            <option value="ordering">Sıralama</option>
                            <option value="open">Açıq Sual</option> {/* Новая опция */}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500">Ballar</label>
                        <input type="number" name="points" value={localQuestion.points || 1} onChange={handleInputChange} min="1" className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm text-xs p-1" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={onDuplicate} variant="secondary" className="!p-2"><DuplicateIcon /></Button>
                    <Button onClick={onDelete} variant="danger" className="!p-2"><TrashIcon /></Button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sualın mətni</label>
                    <textarea name="text" value={localQuestion.text} onChange={handleInputChange} placeholder="Sualınızı bura daxil edin..." rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Şəkil URL-i (istəyə bağlı)</label>
                    <input type="text" name="imageUrl" value={localQuestion.imageUrl || ''} onChange={handleInputChange} placeholder="https://example.com/image.png" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">İzah (istəyə bağlı)</label>
                    <textarea name="explanation" value={localQuestion.explanation || ''} onChange={handleInputChange} placeholder="Düzgün cavabın izahını bura daxil edin..." rows="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"></textarea>
                </div>
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-200 rounded-b-lg">
                <AnswerEditor question={localQuestion} onUpdate={setLocalQuestion} />
            </div>
        </div>
    );
};

export default QuestionEditor;