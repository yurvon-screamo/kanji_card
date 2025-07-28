import { OpenAPI, AuthService, DefaultService, ExtractedWord } from "@/api";

function configureApi() {
  OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "";
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = "include";
  OpenAPI.HEADERS = {
    "Content-Type": "application/json",
  };
}

configureApi();

class ApiService {
  private static instance: ApiService;

  private constructor() {}

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
      console.error("API request failed:", error);
      throw error;
    }
  }

  public async login(login: string, password: string) {
    return this.handleRequest(() => AuthService.login({ login, password }));
  }

  public async register(login: string, password: string) {
    return this.handleRequest(() => AuthService.register({ login, password }));
  }

  public async logout() {
    return this.handleRequest(() => AuthService.logout());
  }

  public async checkAuth() {
    return this.handleRequest(() => DefaultService.getOverview());
  }

  public async listSets() {
    return this.handleRequest(() => DefaultService.listSets());
  }

  public async listUnknownWords() {
    return this.handleRequest(() => DefaultService.listUnknownWords());
  }

  public async listReleasedWords(search?: string) {
    return this.handleRequest(() => DefaultService.listReleasedWords(search));
  }

  public async listTestReleasedWords() {
    return this.handleRequest(() => DefaultService.listTestReleasedWords());
  }

  public async getSet(setId: string) {
    return this.handleRequest(() => DefaultService.getSet(setId));
  }

  public async getOverview() {
    return this.handleRequest(() => DefaultService.getOverview());
  }

  public async buildNewSet(setSize: number) {
    return this.handleRequest(() =>
      DefaultService.buildNewSet({
        set_size: setSize,
      }),
    );
  }

  public async extractWordsFromText(text: string) {
    return this.handleRequest(() =>
      DefaultService.extractWordsFromText({ text }),
    );
  }

  public async extractWordsFromImage(imageData: Uint8Array) {
    return this.handleRequest(() =>
      DefaultService.extractWordsFromImage({
        image_data: Array.from(imageData),
      }),
    );
  }

  public async saveWords(words: ExtractedWord[]) {
    return this.handleRequest(() => DefaultService.saveWords({ words }));
  }

  public async nextIter(setId: string) {
    return this.handleRequest(() => DefaultService.nextIter(setId));
  }
}

export const apiService = ApiService.getInstance();
