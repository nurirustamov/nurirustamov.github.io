import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon, TrophyIcon } from '../assets/icons';

const LeaderboardList = ({ users, title }) => (
    <Card>
        <h2 className="text-xl font-bold text-center mb-4 text-orange-600">{title}</h2>
        {users.length > 0 ? (
            <ol className="space-y-3">
                {users.map((user, index) => (
                    <li key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                            <span className="flex items-center gap-2">
                                {index === 0 ? <GoldMedalIcon /> : index === 1 ? <SilverMedalIcon /> : index === 2 ? <BronzeMedalIcon /> : <TrophyIcon className="text-gray-400" />}
                                <Link to={`/student/${user.user_id}`} className="font-semibold text-gray-800 hover:underline">
                                    {user.userName} {user.userSurname}
                                </Link>
                            </span>
                        </div>
                        <span className="font-bold text-lg text-orange-500">{user.totalScore} bal</span>
                    </li>
                ))}
            </ol>
        ) : (
            <p className="text-center text-gray-500 py-8">Bu reytinq üçün kifayət qədər data yoxdur.</p>
        )}
    </Card>
);

const LeaderboardPage = ({ results }) => {
    const [activeTab, setActiveTab] = useState('weekly');

    const leaderboardData = useMemo(() => {
        const processResults = (filteredResults) => {
            const userScores = filteredResults.reduce((acc, result) => {
                if (!result.user_id) return acc; // Пропускаем результаты без user_id
                
                const key = result.user_id;
                if (!acc[key]) {
                    acc[key] = { 
                        user_id: result.user_id,
                        totalScore: 0, 
                        userName: result.userName, 
                        userSurname: result.userSurname 
                    };
                }
                acc[key].totalScore += result.score;
                return acc;
            }, {});

            return Object.values(userScores)
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 10);
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyResults = results.filter(r => new Date(r.created_at) > sevenDaysAgo);

        return {
            weekly: processResults(weeklyResults),
            overall: processResults(results),
        };
    }, [results]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reytinqlər</h1>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('weekly')} className={`${activeTab === 'weekly' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Həftəlik Reytinq</button>
                    <button onClick={() => setActiveTab('overall')} className={`${activeTab === 'overall' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Ümumi Reytinq</button>
                </nav>
            </div>

            {activeTab === 'weekly' && <LeaderboardList users={leaderboardData.weekly} title="Həftənin Liderləri" />}
            {activeTab === 'overall' && <LeaderboardList users={leaderboardData.overall} title="Bütün Zamanların Liderləri" />}
        </div>
    );
};

export default LeaderboardPage;
