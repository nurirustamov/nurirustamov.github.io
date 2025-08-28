import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, PlayIcon, CheckCircleIcon } from '../assets/icons';
import Comments from '../components/Comments'; // Импортируем новый компонент

const ArticleViewPage = ({ articles, quizzes, onStartQuiz, onMarkAsRead, articleProgress, profile, fetchComments, postComment, deleteComment }) => {
    const { articleId } = useParams();
    const navigate = useNavigate();

    const article = useMemo(() => {
        if (!articles || !quizzes) return null;
        const currentArticle = articles.find(a => a.id === Number(articleId));
        if (!currentArticle) return null;

        const attachedQuizIds = new Set((currentArticle.article_quizzes || []).map(aq => aq.quiz_id));
        const attachedQuizzes = quizzes.filter(q => attachedQuizIds.has(q.id));

        return { ...currentArticle, quizzes: attachedQuizzes };
    }, [articles, quizzes, articleId]);

    const isCompleted = useMemo(() => {
        return articleProgress.some(p => p.article_id === Number(articleId));
    }, [articleProgress, articleId]);

    if (!article) {
        return <Card><p className="text-center">Məqalə tapılmadı.</p></Card>;
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="secondary" onClick={() => navigate('/articles')}><ArrowLeftIcon /> Məqalələr siyahısına qayıt</Button>
                {isCompleted ? (
                    <span className="flex items-center font-semibold text-green-600"><CheckCircleIcon className="w-6 h-6 mr-2" /> Oxunub</span>
                ) : (
                    <Button onClick={() => onMarkAsRead(article.id)}>Oxunmuş kimi işarələ</Button>
                )}
            </div>
            <Card>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{article.title}</h1>
                <div className="prose max-w-none">
                    <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>
                <div className="mt-6 pt-6 border-t">
                    <Comments 
                        targetId={article.id}
                        targetType="article"
                        profile={profile}
                        fetchComments={fetchComments}
                        postComment={postComment}
                        deleteComment={deleteComment}
                    />
                </div>
            </Card>

            {article.quizzes && article.quizzes.length > 0 && (
                <Card>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Mövzuya aid testlər</h2>
                    <div className="space-y-3">
                        {article.quizzes.map(quiz => (
                            <div key={quiz.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                <div>
                                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                                    <p className="text-sm text-gray-500">{quiz.questions.length} sual</p>
                                </div>
                                <Button onClick={() => onStartQuiz(quiz.id)}><PlayIcon /> Testə Başla</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ArticleViewPage;
