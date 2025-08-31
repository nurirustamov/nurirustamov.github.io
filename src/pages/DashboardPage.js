import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ClipboardCheckIcon, DuplicateIcon, StarIcon, FireIcon, BookOpenIcon, CollectionIcon, PaperAirplaneIcon } from '../assets/icons';

// Компонент для отображения прогресса уровня, взятый из ProfilePage
const LevelProgressBar = ({ experience }) => {
    const currentLevel = Math.floor(experience / 100) + 1;
    const nextLevelXp = currentLevel * 100;
    const currentLevelXp = (currentLevel - 1) * 100;
    const xpIntoLevel = experience - currentLevelXp;
    const xpForNextLevel = nextLevelXp - currentLevelXp;
    const progressPercentage = xpForNextLevel > 0 ? (xpIntoLevel / xpForNextLevel) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-orange-600">Səviyyə {currentLevel}</span>
                <span className="text-sm text-gray-500">{experience} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
        </div>
    );
};

const DashboardPage = ({ profile, activeAssignmentsCount, dueFlashcardsCount }) => {
    const navigate = useNavigate();

    if (!profile) {
        return <div className="text-center py-12">Yüklənir...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800">Xoş gəlmisiniz, {profile.first_name || profile.username}!</h1>

            {/* Статистические карточки */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/my-assignments" className="block">
                    <Card className="hover:shadow-orange-200 hover:-translate-y-1 transition-transform duration-200 text-center h-full">
                        <ClipboardCheckIcon className="w-12 h-12 mx-auto text-orange-500" />
                        <p className="text-4xl font-bold mt-2">{activeAssignmentsCount}</p>
                        <p className="text-gray-600 mt-1">Aktiv Tapşırıq</p>
                    </Card>
                </Link>
                <Link to="/decks" className="block">
                    <Card className="hover:shadow-blue-200 hover:-translate-y-1 transition-transform duration-200 text-center h-full">
                        <DuplicateIcon className="w-12 h-12 mx-auto text-blue-500" />
                        <p className="text-4xl font-bold mt-2">{dueFlashcardsCount}</p>
                        <p className="text-gray-600 mt-1">Təkrar üçün Kart</p>
                    </Card>
                </Link>
                <Link to="/profile" className="block">
                    <Card className="hover:shadow-yellow-200 hover:-translate-y-1 transition-transform duration-200 text-center h-full">
                        <StarIcon className="w-12 h-12 mx-auto text-yellow-500" />
                        <p className="text-4xl font-bold mt-2">{profile.experience_points || 0}</p>
                        <p className="text-gray-600 mt-1">Təcrübə Xalı</p>
                    </Card>
                </Link>
                <Link to="/profile" className="block">
                    <Card className="hover:shadow-red-200 hover:-translate-y-1 transition-transform duration-200 text-center h-full">
                        <FireIcon className="w-12 h-12 mx-auto text-red-500" />
                        <p className="text-4xl font-bold mt-2">{profile.daily_streak || 0}</p>
                        <p className="text-gray-600 mt-1">Günlük Seriya</p>
                    </Card>
                </Link>
            </div>

            {/* Прогресс */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Sizin Proqresiniz</h2>
                <LevelProgressBar experience={profile.experience_points || 0} />
            </Card>

            {/* Быстрые действия */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Haradan başlayaq?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button onClick={() => navigate('/quizzes')} variant="secondary" className="h-24 text-lg"><BookOpenIcon /> Testlər</Button>
                    <Button onClick={() => navigate('/courses')} variant="secondary" className="h-24 text-lg"><CollectionIcon /> Kurslar</Button>
                    <Button onClick={() => navigate('/paths')} variant="secondary" className="h-24 text-lg"><PaperAirplaneIcon /> Tədris Yolları</Button>
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;
