import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, CheckCircleIcon } from '../assets/icons';

const FlashcardStudyPage = ({ decks, userReviews, onUpdateReview }) => {
    const { deckId } = useParams();
    
    const [studySession, setStudySession] = useState({ cards: [], currentCardIndex: 0, isFlipped: false });
    const [isSessionLoading, setIsSessionLoading] = useState(true);

    const deck = useMemo(() => decks.find(d => d.id === Number(deckId)), [decks, deckId]);

    useEffect(() => {
        if (!deck) return;

        const now = new Date().toISOString();
        const allCards = deck.flashcards || [];
        
        const dueReviews = (userReviews || []).filter(review => {
            const cardInDeck = allCards.some(c => c.id === review.card_id);
            return cardInDeck && review.next_review_at <= now;
        });

        const newCards = allCards.filter(card => 
            !(userReviews || []).some(review => review.card_id === card.id)
        );

        const dueCardIds = new Set(dueReviews.map(r => r.card_id));
        const dueCardsFromReviews = allCards.filter(c => dueCardIds.has(c.id));

        const cardsToStudy = [...newCards, ...dueCardsFromReviews];
        
        setStudySession({ cards: cardsToStudy, currentCardIndex: 0, isFlipped: false });
        setIsSessionLoading(false);

    }, [deck, userReviews]);

    const handleFlip = () => {
        setStudySession(prev => ({ ...prev, isFlipped: true }));
    };

    const handleGrade = (grade) => { // grade: 0=Again, 1=Hard, 2=Good, 3=Easy
        const currentCard = studySession.cards[studySession.currentCardIndex];
        const review = (userReviews || []).find(r => r.card_id === currentCard.id) || {
            card_id: currentCard.id,
            repetitions: 0,
            ease_factor: 2.5,
            interval: 0
        };

        let { repetitions, ease_factor, interval } = review;

        if (grade >= 2) { // Correct response (Good, Easy)
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * ease_factor);
            }
            repetitions += 1;
        } else { // Incorrect response (Again, Hard)
            repetitions = 0;
            interval = 1;
        }

        ease_factor = ease_factor + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02));
        if (ease_factor < 1.3) ease_factor = 1.3;

        const next_review_at = new Date();
        next_review_at.setDate(next_review_at.getDate() + interval);

        const updatedReview = {
            ...review,
            repetitions,
            ease_factor: parseFloat(ease_factor.toFixed(2)),
            interval,
            next_review_at: next_review_at.toISOString(),
        };

        onUpdateReview(updatedReview);

        // Move to next card
        setStudySession(prev => ({
            ...prev,
            currentCardIndex: prev.currentCardIndex + 1,
            isFlipped: false
        }));
    };

    if (isSessionLoading) {
        return <Card className="text-center py-12">Təkrar sessiyası hazırlanır...</Card>;
    }

    if (!deck) {
        return <Card className="text-center py-12">Koloda tapılmadı.</Card>;
    }

    const isSessionDone = studySession.currentCardIndex >= studySession.cards.length;

    if (isSessionDone) {
        return (
            <Card className="text-center py-12 animate-fade-in">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Sessiya Tamamlandı!</h2>
                <p className="text-gray-600 mt-2">Bu gün üçün bütün təkrarları bitirdiniz. Afərin!</p>
                <Link to="/decks">
                    <Button className="mt-6"><ArrowLeftIcon /> Bütün kolodalara qayıt</Button>
                </Link>
            </Card>
        );
    }

    const currentCard = studySession.cards[studySession.currentCardIndex];
    const progressPercentage = (studySession.currentCardIndex / studySession.cards.length) * 100;

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="mb-4">
                <Link to="/decks">
                    <Button variant="secondary"><ArrowLeftIcon /> Kolodalara qayıt</Button>
                </Link>
            </div>
            <Card>
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-600">{deck.title}</span>
                        <span className="text-sm font-semibold text-gray-600">{studySession.currentCardIndex + 1} / {studySession.cards.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                <div className={`w-full h-64 perspective-1000`}>
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${studySession.isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front of the card */}
                        <div className="absolute w-full h-full backface-hidden bg-orange-50 rounded-lg flex items-center justify-center p-6 text-center">
                            <p className="text-xl font-semibold text-gray-800">{currentCard.front}</p>
                        </div>
                        {/* Back of the card */}
                        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-50 rounded-lg flex items-center justify-center p-6 text-center">
                            <p className="text-xl font-semibold text-gray-800">{currentCard.back}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {!studySession.isFlipped ? (
                        <Button onClick={handleFlip} className="w-full">Cavabı Göstər</Button>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button onClick={() => handleGrade(0)} variant="danger">Yenidən</Button>
                            <Button onClick={() => handleGrade(1)} className="bg-yellow-500 hover:bg-yellow-600 text-white">Çətin</Button>
                            <Button onClick={() => handleGrade(2)} className="bg-green-500 hover:bg-green-600 text-white">Yaxşı</Button>
                            <Button onClick={() => handleGrade(3)} className="bg-blue-500 hover:bg-blue-600 text-white">Asan</Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default FlashcardStudyPage;