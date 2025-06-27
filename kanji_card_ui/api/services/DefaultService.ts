/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckTestAnswerRequest } from '../models/CheckTestAnswerRequest';
import type { CheckTestAnswerResponse } from '../models/CheckTestAnswerResponse';
import type { CreateRuleFromDescriptionRequest } from '../models/CreateRuleFromDescriptionRequest';
import type { CreateRuleFromTextRequest } from '../models/CreateRuleFromTextRequest';
import type { CreateRuleResponse } from '../models/CreateRuleResponse';
import type { ExtractedWord } from '../models/ExtractedWord';
import type { ExtractWordsFromImageRequest } from '../models/ExtractWordsFromImageRequest';
import type { ExtractWordsFromTextRequest } from '../models/ExtractWordsFromTextRequest';
import type { MarkAsTobeRequest } from '../models/MarkAsTobeRequest';
import type { ReleaseRuleRequest } from '../models/ReleaseRuleRequest';
import type { RuleDetailResponse } from '../models/RuleDetailResponse';
import type { RuleResponse } from '../models/RuleResponse';
import type { SaveWordsRequest } from '../models/SaveWordsRequest';
import type { SetResponse } from '../models/SetResponse';
import type { StoryResponse } from '../models/StoryResponse';
import type { WordOverview } from '../models/WordOverview';
import type { WordResponse } from '../models/WordResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * @returns WordOverview Sets overview retrieved successfully
     * @throws ApiError
     */
    public static getOverview(): CancelablePromise<WordOverview> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/query/overview',
            errors: {
                500: `Internal server error`,
            },
        });
    }
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
            url: '/api/query/rules',
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
            url: '/api/query/rules/{id}',
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
     * @returns SetResponse List of current sets retrieved successfully
     * @throws ApiError
     */
    public static listCurrentSets(): CancelablePromise<Array<SetResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/query/sets/current',
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
            url: '/api/query/sets/released',
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
            url: '/api/query/sets/test-released',
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
            url: '/api/query/sets/tobe',
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
            url: '/api/query/sets/{id}',
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
     * @param search Search term for stories (case-insensitive)
     * @returns StoryResponse List of released stories retrieved successfully
     * @throws ApiError
     */
    public static listReleasedStories(
        search?: string,
    ): CancelablePromise<Array<StoryResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/query/stories/released',
            query: {
                'search': search,
            },
            errors: {
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
            url: '/api/set/rules/check-test',
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
            url: '/api/set/rules/create/description',
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
            url: '/api/set/rules/create/text',
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
            url: '/api/set/rules/release',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Rule not found`,
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
            url: '/api/set/sets/tobe',
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
            url: '/api/set/sets/words/extract/image',
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
            url: '/api/set/sets/words/extract/text',
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
            url: '/api/set/sets/words/save',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param id Set ID
     * @returns any Set marked as current successfully
     * @throws ApiError
     */
    public static markAsCurrent(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/set/sets/{id}/current',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param id Set ID
     * @returns any Set marked as finished successfully
     * @throws ApiError
     */
    public static markAsFinished(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/set/sets/{id}/finished',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
