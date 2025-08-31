import React from 'react';
import Button from './Button';
import { ArrowRightIcon, XIcon, LightbulbIcon } from '../../assets/icons';

const SmartRecommendationCard = ({ recommendation, onStart, onClose }) => {
    if (!recommendation) return null;

    const { reason, item } = recommendation;
    const itemType = item.content ? 'article' : 'course'; // A simple way to differentiate

    return (
        <div className="bg-white border-l-4 border-blue-400 p-4 rounded-lg shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <LightbulbIcon className="w-8 h-8 flex-shrink-0 text-blue-500" />
                <div>
                    <p className="font-bold text-gray-800">Fərdi Tövsiyə</p>
                    <p className="text-sm text-gray-600">
                        <span className="opacity-80">Görünür ki, "<strong>{reason}</strong>" mövzusunda çətinlikləriniz var. Bu {itemType === 'article' ? 'məqaləni' : 'kursu'} nəzərdən keçirməyə nə deyirsiniz?</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button onClick={() => onStart(item.id, itemType)} variant="primary" size="sm">
                    Başla <ArrowRightIcon />
                </Button>
                <Button onClick={onClose} variant="ghost" size="sm">
                    <XIcon />
                </Button>
            </div>
        </div>
    );
};

export default SmartRecommendationCard;
