/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JapanesePartOfSpeech } from './JapanesePartOfSpeech';
export type WordResponse = {
    id: string;
    part_of_speech?: (null | JapanesePartOfSpeech);
    reading?: string | null;
    translation: string;
    word: string;
};

