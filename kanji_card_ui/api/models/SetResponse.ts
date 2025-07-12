/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LearnSetState } from './LearnSetState';
import type { WordResponse } from './WordResponse';
export type SetResponse = {
    id: string;
    need_to_learn: boolean;
    state: LearnSetState;
    time_to_learn?: string | null;
    words: Array<WordResponse>;
};

