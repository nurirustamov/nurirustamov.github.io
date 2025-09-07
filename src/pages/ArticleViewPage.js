import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, PlayIcon, CheckCircleIcon } from '../assets/icons';
import Comments from '../components/Comments';

const ArticleStyles = () => (
    <style>{`
        .article-content h1, .article-content h2, .article-content h3, .article-content h4 {
            margin-bottom: 0.75em !important;
            margin-top: 1.5em !important;
            font-weight: 700 !important;
            line-height: 1.3 !important;
        }
        .article-content h1 { font-size: 2.25em !important; !important; /* red-600 */ }
        .article-content h2 { font-size: 1.875em !important; !important; /* blue-600 */ }
        .article-content h3 { font-size: 1.5em !important; !important; /* green-600 */ }
        .article-content p {
            margin-bottom: 1.25em !important;
            line-height: 1.7 !important;
            color: #374151 !important; /* gray-700 */
        }
        .article-content ul, .article-content ol {
            margin-left: 1.5em !important;
            margin-bottom: 1.25em !important;
            padding-left: 1.5em !important;
        }
        .article-content ul { list-style-type: disc !important; }
        .article-content ol { list-style-type: decimal !important; }
        .article-content li { margin-bottom: 0.5em !important; }
        .article-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 1.5em !important;
            border: 1px solid #e5e7eb !important; /* gray-200 */
        }
        .article-content th, .article-content td {
            border: 1px solid #e5e7eb !important; /* gray-200 */
            padding: 0.75em 1em !important;
            text-align: left !important;
        }
        .article-content th {
            background-color: #f9fafb !important; /* gray-50 */
            font-weight: 600 !important;
        }
        .article-content a {
            color: #ea580c !important; /* orange-600 */
            text-decoration: underline !important;
        }
        .article-content strong { font-weight: 700 !important; }
        .article-content em { font-style: italic !important; }
        .article-content blockquote {
            border-left: 4px solid #f97316 !important; /* orange-500 */
            padding-left: 1em !important;
            margin-left: 0 !important;
            font-style: italic !important;
            color: #4b5563 !important; /* gray-600 */
        }
    `}</style>
);

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

    // --- DIAGNOSTIC LOGS ---
    console.log("HTML до очистки:", article.content);
    const sanitizedContent = DOMPurify.sanitize(article.content);
    console.log("HTML после очистки:", sanitizedContent);
    // --- END DIAGNOSTIC LOGS ---

    return (
        <>
            <ArticleStyles />
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
                    <div className="article-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
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
        </>
    );
};

export default ArticleViewPage;
