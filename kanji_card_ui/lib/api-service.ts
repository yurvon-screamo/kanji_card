import { AuthService, DefaultService, OpenAPI, MarkAsTobeRequest, ExtractedWord } from '@/api';

function configureApi() {
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || '';
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.CREDENTIALS = 'include';
    OpenAPI.HEADERS = {
        'Content-Type': 'application/json',
    };
}

configureApi();

class ApiService {
    private static instance: ApiService;

    private constructor() { }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    private async handleRequest<T>(request: () => Promise<T>): Promise<T> {
        try {
            return await request();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth methods
    public async login(login: string, password: string) {
        return this.handleRequest(() =>
            AuthService.login({ login, password })
        );
    }

    public async register(login: string, password: string) {
        return this.handleRequest(() =>
            AuthService.register({ login, password })
        );
    }

    public async checkAuth() {
        return this.handleRequest(() =>
            DefaultService.getOverview()
        );
    }

    public async listTobeSets() {
        return this.handleRequest(() =>
            DefaultService.listTobeSets()
        );
    }


    public async listCurrentSets() {
        return this.handleRequest(() =>
            DefaultService.listCurrentSets()
        );
    }


    public async listReleasedWords(search?: string) {
        return this.handleRequest(() =>
            DefaultService.listReleasedSets(search)
        );
    }

    public async getSet(setId: string) {
        return this.handleRequest(() =>
            DefaultService.getSet(setId)
        );
    }

    public async getOverview() {
        return this.handleRequest(() =>
            DefaultService.getOverview()
        );
    }

    public async markAsFinished(setId: string) {
        return this.handleRequest(() =>
            DefaultService.markAsFinished(setId)
        );
    }

    public async markAsCurrent(setId: string) {
        return this.handleRequest(() =>
            DefaultService.markAsCurrent(setId)
        );
    }

    public async markAsTobe(wordIds: string[]) {
        return this.handleRequest(() =>
            DefaultService.markAsTobe({
                word_ids: wordIds
            } as MarkAsTobeRequest)
        );
    }

    public async extractWordsFromText(text: string) {
        return this.handleRequest(() =>
            DefaultService.extractWordsFromText({ text })
        );
    }

    public async extractWordsFromImage(imageData: Uint8Array) {
        return this.handleRequest(() =>
            DefaultService.extractWordsFromImage({
                image_data: Array.from(imageData),
            })
        );
    }

    public async saveWords(words: ExtractedWord[]) {
        return this.handleRequest(() =>
            DefaultService.saveWords({ words })
        );
    }
}

export const apiService = ApiService.getInstance(); 