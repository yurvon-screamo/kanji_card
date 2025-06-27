/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JapanesePartOfSpeech } from './JapanesePartOfSpeech';
import type { RuleExampleResponse } from './RuleExampleResponse';
import type { RuleTestResponse } from './RuleTestResponse';
export type RuleDetailResponse = {
    description: string;
    examples: Array<RuleExampleResponse>;
    id: string;
    is_released: boolean;
    part_of_speech: JapanesePartOfSpeech;
    release_time?: string | null;
    tests: Array<RuleTestResponse>;
    title: string;
};

