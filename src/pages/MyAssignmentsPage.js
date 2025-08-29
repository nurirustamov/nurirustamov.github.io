import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PlayIcon, DocumentTextIcon, CollectionIcon, ClockIcon, CheckCircleIcon, EyeIcon } from '../assets/icons';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const MyAssignmentsPage = ({ assignments, quizzes, courses, quizResults, completedCourses, onStartQuiz }) => {

    const enrichedAssignments = useMemo(() => {
        const completedQuizIds = new Set((quizResults || []).map(r => r.quizId));
        const completedCourseIds = new Set((completedCourses || []).map(c => c.course_id));

        return assignments.map(assignment => {
            let item = null;
            let isCompleted = false;
            if (assignment.item_type === 'quiz') {
                item = quizzes.find(q => q.id === assignment.item_id);
                if (item) {
                    isCompleted = completedQuizIds.has(item.id);
                }
            } else if (assignment.item_type === 'course') {
                item = courses.find(c => c.id === assignment.item_id);
                if (item) {
                    isCompleted = completedCourseIds.has(item.id);
                }
            }
            return { ...assignment, item, isCompleted };
        }).filter(a => a.item); // Filter out assignments where the item might have been deleted
    }, [assignments, quizzes, courses, quizResults, completedCourses]);

    const now = new Date();
    const activeAssignments = enrichedAssignments.filter(a => !a.isCompleted);
    const completedAssignments = enrichedAssignments.filter(a => a.isCompleted);

    const AssignmentCard = ({ assignment }) => {
        const { item, item_type, due_date, isCompleted } = assignment;
        const isOverdue = !isCompleted && due_date && new Date(due_date) < now;

        return (
            <Card className={`border-l-4 ${isCompleted ? 'border-green-500 bg-green-50/50 opacity-70' : (isOverdue ? 'border-red-500' : 'border-gray-200')}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            {item_type === 'quiz' ? <DocumentTextIcon className="text-purple-500" /> : <CollectionIcon className="text-blue-500" />}
                            <span className="text-xs font-semibold uppercase tracking-wider">{item_type === 'quiz' ? 'Test' : 'Kurs'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                    </div>
                    <div className="flex-shrink-0 w-full sm:w-auto">
                        {isCompleted ? (
                            <p className="text-sm font-semibold flex items-center gap-2 text-green-600">
                                <CheckCircleIcon />
                                <span>Tamamlanıb</span>
                            </p>
                        ) : (
                            <p className={`text-sm font-semibold flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                <ClockIcon />
                                <span>Son tarix: {formatDate(due_date) || 'Yoxdur'}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    {isCompleted ? (
                        <Link to={item_type === 'quiz' ? `/quiz/${item.id}/review` : `/courses/${item.id}`}>
                            <Button variant="secondary" size="sm"><EyeIcon /> Nəticəyə bax</Button>
                        </Link>
                    ) : (
                        item_type === 'quiz' ? (
                            <Button onClick={() => onStartQuiz(item.id)}><PlayIcon /> Başla</Button>
                        ) : (
                            <Link to={`/courses/${item.id}`}><Button><PlayIcon /> Başla</Button></Link>
                        )
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Aktiv Tapşırıqlarım</h1>
                {activeAssignments.length > 0 ? (
                    <div className="space-y-4">
                        {activeAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <p className="text-gray-500">Aktiv tapşırığınız yoxdur. Afərin!</p>
                    </Card>
                )}
            </div>

            {completedAssignments.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Tamamlanmış Tapşırıqlar</h2>
                    <div className="space-y-4">
                        {completedAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAssignmentsPage;