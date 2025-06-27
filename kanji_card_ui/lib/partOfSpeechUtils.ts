import { JapanesePartOfSpeech } from '@/api';

export const getPartOfSpeechLabel = (partOfSpeech: JapanesePartOfSpeech | string): string => {
    const labels: { [key: string]: string } = {
        // Японские части речи из API
        'Meishi': 'Существительное',
        'Daimeishi': 'Местоимение',
        'Doushi': 'Глагол',
        'Keiyoushi': 'Прилагательное',
        'Keiyoudoushi': 'Наречное прилагательное',
        'Fukushi': 'Наречие',
        'Rentaishi': 'Преноминальный модификатор',
        'Setsuzokushi': 'Союз',
        'Joshi': 'Частица',
        'Jodoushi': 'Вспомогательный глагол',
        'Kandoushi': 'Междометие',

        // Английские части речи (для обратной совместимости)
        'Noun': 'Существительное',
        'Verb': 'Глагол',
        'Adjective': 'Прилагательное',
        'Adverb': 'Наречие',
        'Particle': 'Частица',
        'Conjunction': 'Союз',
        'Interjection': 'Междометие',
        'Pronoun': 'Местоимение',
        'Preposition': 'Предлог',
        'Auxiliary': 'Вспомогательный',
        'Other': 'Другое',
    };

    return labels[partOfSpeech] || partOfSpeech;
};