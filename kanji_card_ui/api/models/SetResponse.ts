/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SetState } from './SetState';
import type { StoryResponse } from './StoryResponse';
import type { WordResponse } from './WordResponse';
export type SetResponse = {
    id: string;
    state: SetState;
    story?: (null | StoryResponse);
    words: Array<WordResponse>;
};

