export const formatTimeToLearn = (timeToLearn?: string): string => {
    if (!timeToLearn) return 'Не определено';

    const date = new Date(timeToLearn);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs < 0) {
        // Время уже прошло
        const absDays = Math.abs(diffDays);
        const absHours = Math.abs(diffHours);

        if (absDays > 0) {
            return `Просрочено на ${absDays} дн.`;
        } else if (absHours > 0) {
            return `Просрочено на ${absHours} ч.`;
        } else {
            return 'Просрочено';
        }
    } else {
        // Время еще не наступило
        if (diffDays > 0) {
            return `Через ${diffDays} дн.`;
        } else if (diffHours > 0) {
            return `Через ${diffHours} ч.`;
        } else {
            return 'Сейчас';
        }
    }
};

export const getTimeToLearnColor = (timeToLearn?: string): string => {
    if (!timeToLearn) return 'text-gray-500';

    const date = new Date(timeToLearn);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) {
        return 'text-red-600'; // Просрочено
    } else if (diffMs < 24 * 60 * 60 * 1000) {
        return 'text-orange-600'; // В течение дня
    } else {
        return 'text-blue-600'; // В будущем
    }
}; 