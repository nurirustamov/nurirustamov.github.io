import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchIcon, PlusIcon, PlayIcon, EditIcon, TrashIcon, DuplicateIcon } from '../assets/icons';

const QuizListPage = ({ quizzes, onStartQuiz, onAddNewQuiz, onEditQuiz, onDeleteRequest, onCloneQuiz }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = useMemo(() => ['all', ...new Set(quizzes.map(q => q.category || 'Kateqoriyasız'))], [quizzes]);

    const sortedAndFilteredQuizzes = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return quizzes
            .filter(quiz =>
                (selectedCategory === 'all' || (quiz.category || 'Kateqoriyasız') === selectedCategory) &&
                (quiz.title.toLowerCase().includes(term) ||
                (quiz.description && quiz.description.toLowerCase().includes(term)))
            )
            .sort((a, b) => {
                switch (sortBy) {
                    case 'title_asc': return a.title.localeCompare(b.title);
                    case 'title_desc': return b.title.localeCompare(a.title);
                    case 'questions_asc': return a.questions.length - b.questions.length;
                    case 'questions_desc': return b.questions.length - a.questions.length;
                    case 'date_asc': return a.id - b.id;
                    case 'date_desc':
                    default: return b.id - a.id;
                }
            });
    }, [quizzes, searchTerm, sortBy, selectedCategory]);

    return (
        <div className="animate-fade-in">
            <Card className="mb-8 !p-4 bg-gray-50 border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative flex-grow w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input type="text" placeholder="Adına və ya təsvirinə görə axtarış..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg w-full focus:ring-orange-400 focus:border-orange-400 transition" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="py-2 px-4 border-2 border-gray-200 rounded-lg bg-white w-full sm:w-auto">
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'all' ? 'Bütün kateqoriyalar' : cat}</option>
                            ))}
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="py-2 px-4 border-2 border-gray-200 rounded-lg bg-white w-full sm:w-auto">
                            <option value="date_desc">Ən yenilər</option>
                            <option value="date_asc">Ən köhnələr</option>
                            <option value="title_asc">Ad (A-Z)</option>
                            <option value="title_desc">Ad (Z-A)</option>
                            <option value="questions_desc">Çox sual</option>
                            <option value="questions_asc">Az sual</option>
                        </select>
                        <Button onClick={onAddNewQuiz} className="w-full sm:w-auto"><PlusIcon /><span className="sm:hidden md:inline">Test yarat</span></Button>
                    </div>
                </div>
            </Card>

            {sortedAndFilteredQuizzes.length === 0 ? (
                <Card className="text-center py-12"><p className="text-gray-500">Testlər tapılmadı. Filtləri dəyişməyə və ya yeni test yaratmağa cəhd edin!</p></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedAndFilteredQuizzes.map(quiz => (
                        <Card key={quiz.id} className="hover:shadow-orange-200 hover:-translate-y-1 flex flex-col border-l-4 border-orange-400">
                            <div className="flex-grow">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                                    <h2 className="text-xl font-bold text-gray-800 flex-1 pr-2 mb-2 sm:mb-0">{quiz.title}</h2>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap">{quiz.category || 'Kateqoriyasız'}</span>
                                </div>
                                <p className="text-gray-600 mb-4 h-12 overflow-hidden text-sm">{quiz.description}</p>
                                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                    <span>{quiz.questions.length} sual</span>
                                    <span>{quiz.timeLimit || 10} dəq</span>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Button onClick={() => onStartQuiz(quiz.id)} className="flex-1" disabled={quiz.questions.length === 0}><PlayIcon /> <span className="hidden sm:inline ml-1">Başla</span></Button>
                                <Button onClick={() => onCloneQuiz(quiz.id)} variant="secondary"><DuplicateIcon /></Button>
                                <Button onClick={() => onEditQuiz(quiz.id)} variant="secondary"><EditIcon /></Button>
                                <Button onClick={() => onDeleteRequest(quiz.id)} variant="danger"><TrashIcon /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizListPage;