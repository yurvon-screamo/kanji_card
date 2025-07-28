/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtractedWord } from '../models/ExtractedWord';
import type { ExtractWordsFromImageRequest } from '../models/ExtractWordsFromImageRequest';
import type { ExtractWordsFromTextRequest } from '../models/ExtractWordsFromTextRequest';
import type { MarkAsTobeRequest } from '../models/MarkAsTobeRequest';
import type { MarkAsUnknownRequest } from '../models/MarkAsUnknownRequest';
import type { SaveWordsRequest } from '../models/SaveWordsRequest';
import type { SetResponse } from '../models/SetResponse';
import type { WordOverview } from '../models/WordOverview';
import type { WordResponse } from '../models/WordResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * @param requestBody
     * @returns any Words marked as tobe successfully
     * @throws ApiError
     */
    public static buildNewSet(
        requestBody: MarkAsTobeRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/word/build_set',
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
            url: '/api/word/extract/image',
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
            url: '/api/word/extract/text',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param setId Set ID
     * @returns any Set to next learn stage successfully
     * @throws ApiError
     */
    public static nextIter(
        setId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/word/next_iter/{set_id}',
            path: {
                'set_id': setId,
            },
            errors: {
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
     * @returns SetResponse List of all sets retrieved successfully
     * @throws ApiError
     */
    public static listSets(): CancelablePromise<Array<SetResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets',
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
     * @returns WordResponse List of unknown words retrieved successfully
     * @throws ApiError
     */
    public static listUnknownWords(): CancelablePromise<Array<WordResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/word/query/sets/unknown',
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
     * @returns any Words saved successfully
     * @throws ApiError
     */
    public static saveWords(
        requestBody: SaveWordsRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/word/save_word',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Words marked as unknown successfully
     * @throws ApiError
     */
    public static markWordAsUnknown(
        requestBody: MarkAsUnknownRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/word/word_as_unknown',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
