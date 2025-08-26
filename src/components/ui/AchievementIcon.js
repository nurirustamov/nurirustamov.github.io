import React from 'react';
import { StarIcon, FireIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

const AchievementIcon = ({ iconName, badgeColor, className = 'h-10 w-10' }) => {
    const iconMap = {
        sniper: StarIcon,
        marathoner: FireIcon,
        newbie: AcademicCapIcon,
    };

    const colorMap = {
        gold: 'text-yellow-500',
        silver: 'text-gray-400',
        bronze: 'text-orange-400',
    };

    const IconComponent = iconMap[iconName] || StarIcon; // Иконка по умолчанию
    const colorClass = colorMap[badgeColor] || 'text-gray-500';

    return (
        <div className={`relative ${className}`}>
            <IconComponent className={colorClass} />
            <div className={`absolute inset-0 ${colorClass} opacity-25 blur-sm`}></div>
        </div>
    );
};

export default AchievementIcon;
