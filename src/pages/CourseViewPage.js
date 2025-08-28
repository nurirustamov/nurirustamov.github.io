import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, DocumentTextIcon, PencilAltIcon, PlayIcon, CheckCircleIcon } from '../assets/icons';

const CourseViewPage = ({ courses, onStartQuiz, articleProgress, quizResults, session }) => {
    const { courseId } = useParams();

    const course = useMemo(() => {
        return courses.find(c => c.id === Number(courseId));
    }, [courses, courseId]);

    const contentWithStatus = useMemo(() => {
        if (!course || !session) return (course?.course_items || []).sort((a, b) => a.order - b.order);

        const completedArticleIds = new Set((articleProgress || []).map(p => p.article_id));
        const completedQuizIds = new Set((quizResults || []).filter(r => r.user_id === session.user.id).map(r => r.quizId));

        return (course.course_items || []).sort((a, b) => a.order - b.order).map(item => {
            let isCompleted = false;
            if (item.article_id) {
                isCompleted = completedArticleIds.has(item.article_id);
            } else if (item.quiz_id) {
                isCompleted = completedQuizIds.has(item.quiz_id);
            }
            return { ...item, isCompleted };
        });
    }, [course, articleProgress, quizResults, session]);

    if (!course) {
        return <Card className="text-center py-12"><p className="text-gray-500">Yüklənir...</p></Card>;
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <div>
                <Link to="/courses">
                    <Button variant="secondary" className="mb-4"><ArrowLeftIcon /> Kurslar siyahısına qayıt</Button>
                </Link>
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{course.title}</h1>
                    <p className="text-lg text-gray-600">{course.description}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Kursun Proqramı</h2>
                <ol className="space-y-4">
                    {contentWithStatus.map((item, index) => {
                            let itemTitle = 'Yüklənir...';
                            let itemIcon = null;
                            let itemLink = null;
                            let actionButton = null;

                            if (item.articles) {
                                itemTitle = item.articles.title;
                                itemIcon = <DocumentTextIcon className="w-6 h-6 text-blue-500" />;
                                itemLink = `/articles/${item.article_id}`;
                                actionButton = <Link to={itemLink}><Button variant="secondary" size="sm">Bax</Button></Link>;
                            } else if (item.quizzes) {
                                itemTitle = item.quizzes.title;
                                itemIcon = <PencilAltIcon className="w-6 h-6 text-purple-500" />;
                                actionButton = <Button size="sm" onClick={() => onStartQuiz(item.quiz_id)}><PlayIcon /> Başla</Button>;
                            }

                            return (
                                <li key={item.id || `${item.article_id || item.quiz_id}-${item.order}`} className="flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:border-orange-400 hover:bg-orange-50/50">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        {item.isCompleted ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <span className="font-bold text-gray-500">{index + 1}</span>}
                                    </div>
                                    <div className="flex-shrink-0">
                                        {itemIcon}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{itemTitle}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {actionButton}
                                    </div>
                                </li>
                            );
                    })}
                </ol>
                {(course.course_items || []).length === 0 && (
                    <p className="text-center text-gray-500 py-8">Kursun proqramı boşdur.</p>
                )}
            </div>
        </div>
    );
};

export default CourseViewPage;