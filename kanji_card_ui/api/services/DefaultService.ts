/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckTestAnswerRequest } from '../models/CheckTestAnswerRequest';
import type { CheckTestAnswerResponse } from '../models/CheckTestAnswerResponse';
import type { CreateRuleFromDescriptionRequest } from '../models/CreateRuleFromDescriptionRequest';
import type { CreateRuleFromTextRequest } from '../models/CreateRuleFromTextRequest';
import type { CreateRuleResponse } from '../models/CreateRuleResponse';
import type { CurrentSets } from '../models/CurrentSets';
import type { ExtractedWord } from '../models/ExtractedWord';
import type { ExtractWordsFromImageRequest } from '../models/ExtractWordsFromImageRequest';
import type { ExtractWordsFromTextRequest } from '../models/ExtractWordsFromTextRequest';
import type { MarkAsTobeRequest } from '../models/MarkAsTobeRequest';
import type { ReleaseRuleRequest } from '../models/ReleaseRuleRequest';
import type { RuleDetailResponse } from '../models/RuleDetailResponse';
import type { RuleResponse } from '../models/RuleResponse';
import type { SaveWordsRequest } from '../models/SaveWordsRequest';
import type { SetResponse } from '../models/SetResponse';
import type { WordOverview } from '../models/WordOverview';
import type { WordResponse } from '../models/WordResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * @param search Search term for rules (case-insensitive)
     * @returns RuleResponse List of rules retrieved successfully
     * @throws ApiError
     */
    public static listRules(
        search?: string,
    ): CancelablePromise<Array<RuleResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rule/query/rules',
            query: {
                'search': search,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param id Rule ID
     * @returns RuleDetailResponse Rule retrieved successfully
     * @throws ApiError
     */
    public static getRule(
        id: string,
    ): CancelablePromise<RuleDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/rule/query/rules/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Rule not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CheckTestAnswerResponse Test answer checked successfully
     * @throws ApiError
     */
    public static checkTestAnswer(
        requestBody: CheckTestAnswerRequest,
    ): CancelablePromise<CheckTestAnswerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rule/rules/check-test',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Rule or test not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CreateRuleResponse Grammar rule created successfully
     * @throws ApiError
     */
    public static createRuleFromDescription(
        requestBody: CreateRuleFromDescriptionRequest,
    ): CancelablePromise<CreateRuleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rule/rules/create/description',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CreateRuleResponse Grammar rule created successfully
     * @throws ApiError
     */
    public static createRuleFromText(
        requestBody: CreateRuleFromTextRequest,
    ): CancelablePromise<CreateRuleResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rule/rules/create/text',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Rule released successfully
     * @throws ApiError
     */
    public static releaseRule(
        requestBody: ReleaseRuleRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/rule/rules/release',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Rule not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param id Rule ID
     * @returns any Rule removed successfully
     * @throws ApiError
     */
    public static removeRule(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/rule/rules/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Rule not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * @returns WordOverview Sets overview retrieved successfully
     * @throws ApiError
     */
    public static getOverview(): CancelablePromise<WordOverview> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/overview',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @returns CurrentSets Current sets retrieved successfully
     * @throws ApiError
     */
    public static listCurrentSets(): CancelablePromise<CurrentSets> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets/current',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param search Search term for cards (case-insensitive)
     * @returns WordResponse List of released cards retrieved successfully
     * @throws ApiError
     */
    public static listReleasedWords(
        search?: string,
    ): CancelablePromise<Array<WordResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets/released',
            query: {
                'search': search,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @returns WordResponse List of test released cards retrieved successfully in alternating order by release date
     * @throws ApiError
     */
    public static listTestReleasedWords(): CancelablePromise<Array<WordResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets/test-released',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @returns SetResponse List of tobe sets retrieved successfully
     * @throws ApiError
     */
    public static listTobeSets(): CancelablePromise<Array<SetResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets/tobe',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param id Set ID
     * @returns SetResponse Set retrieved successfully
     * @throws ApiError
     */
    public static getSet(
        id: string,
    ): CancelablePromise<SetResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Set not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Words marked as tobe successfully
     * @throws ApiError
     */
    public static markAsTobe(
        requestBody: MarkAsTobeRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/word/sets/tobe',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ExtractedWord Words extracted successfully
     * @throws ApiError
     */
    public static extractWordsFromImage(
        requestBody: ExtractWordsFromImageRequest,
    ): CancelablePromise<Array<ExtractedWord>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/word/sets/words/extract/image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ExtractedWord Words extracted successfully
     * @throws ApiError
     */
    public static extractWordsFromText(
        requestBody: ExtractWordsFromTextRequest,
    ): CancelablePromise<Array<ExtractedWord>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/word/sets/words/extract/text',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Words saved successfully
     * @throws ApiError
     */
    public static saveWords(
        requestBody: SaveWordsRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/word/sets/words/save',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param id Set ID
     * @returns any Set to next learn stage successfully
     * @throws ApiError
     */
    public static toNextLearnIter(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/word/sets/{id}/to_next_learn_iter',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
