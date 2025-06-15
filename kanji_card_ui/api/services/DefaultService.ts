/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtractedWord } from '../models/ExtractedWord';
import type { ExtractWordsFromImageRequest } from '../models/ExtractWordsFromImageRequest';
import type { ExtractWordsFromTextRequest } from '../models/ExtractWordsFromTextRequest';
import type { SaveWordsRequest } from '../models/SaveWordsRequest';
import type { SetResponse } from '../models/SetResponse';
import type { SetState } from '../models/SetState';
import type { WordOverview } from '../models/WordOverview';
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
     * @param state Filter by set state
     * @returns string List of set IDs retrieved successfully
     * @throws ApiError
     */
    public static listSets(
        state?: SetState,
    ): CancelablePromise<Array<string>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/query/sets',
            query: {
                'state': state,
            },
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
    /**
     * @param id Set ID
     * @returns any Set marked as tobe successfully
     * @throws ApiError
     */
    public static markAsTobe(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/set/sets/{id}/tobe',
            path: {
                'id': id,
            },
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
