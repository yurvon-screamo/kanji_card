import { AuthService, DefaultService, SetState, OpenAPI } from '@/api';
import { redirect } from 'next/navigation';

// Configure the API client
function configureApi() {
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || '';
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.CREDENTIALS = 'include';
    OpenAPI.HEADERS = {
        'Content-Type': 'application/json',
    };
}

// Initialize the API configuration
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
        } catch (error: any) {
            console.error('API request failed:', error);
            // if (error.status === 401) {
            window.location.href = '/login';
            throw new Error('Unauthorized');
            // }
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

    public async markAsTobe(setId: string) {
        return this.handleRequest(() =>
            DefaultService.markAsTobe(setId)
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

    public async saveWords(words: any[]) {
        return this.handleRequest(() =>
            DefaultService.saveWords({ words })
        );
    }
}

export const apiService = ApiService.getInstance(); 