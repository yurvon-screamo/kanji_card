import { JapaneseWord, Set, Collection } from "../types";
import { ExtractedWord, SetResponse, SetState, WordOverview, WordResponse } from "../../../api";
import { apiService } from "@/lib/api-service";

export class WordRepository {
  private static instance: WordRepository;

  private constructor() { }

  public static getInstance(): WordRepository {
    if (!WordRepository.instance) {
      WordRepository.instance = new WordRepository();
    }
    return WordRepository.instance;
  }

  private mapSetResponseToSet(
    setResponse: SetResponse,
  ): Set {
    return {
      id: setResponse.id,
      words: setResponse.words.map((w) =>
        this.mapWordResponseToJapaneseWord(w),
      ),
      state: this.mapSetStateToCollection(setResponse.state),
    };
  }

  private mapWordResponseToJapaneseWord(
    wordResponse: WordResponse,
  ): JapaneseWord {
    return {
      id: wordResponse.id,
      word: wordResponse.word,
      reading: wordResponse.reading || "",
      meaning: wordResponse.translation,
    };
  }

  public async getLearnedWords(search: string | undefined): Promise<JapaneseWord[]> {
    const response = await apiService.listReleasedWords();
    return response.map(x => this.mapWordResponseToJapaneseWord(x))
  }

  public async getInProgressSets(): Promise<Set[]> {
    const response = await apiService.listCurrentSets();
    return response.map(x => this.mapSetResponseToSet(x))
  }

  public async getUnlearnedSets(): Promise<Set[]> {
    const response = await apiService.listTobeSets();
    return response.map(x => this.mapSetResponseToSet(x))
  }

  public async markSetAsLearned(setId: string): Promise<void> {
    await apiService.markAsFinished(setId);
  }

  public async moveToInProgress(setId: string): Promise<void> {
    await apiService.markAsCurrent(setId);
  }

  public async getOverview(): Promise<WordOverview> {
    return await apiService.getOverview();
  }


  public async getSetById(setId: string): Promise<Set | null> {
    const setResponse = await apiService.getSet(setId);
    return this.mapSetResponseToSet(setResponse);
  }

  private mapSetStateToCollection(state: SetState): Collection {
    switch (state) {
      case SetState.CURRENT:
        return Collection.IN_PROGRESS;
      case SetState.TOBE:
        return Collection.NEW;
      default:
        return Collection.NEW;
    }
  }

  public async extractWordsFromText(text: string): Promise<ExtractedWord[]> {
    return await apiService.extractWordsFromText(text);
  }

  public async extractWordsFromImage(imageData: Uint8Array): Promise<ExtractedWord[]> {
    return await apiService.extractWordsFromImage(imageData);
  }

  public async saveWords(words: ExtractedWord[]): Promise<void> {
    await apiService.saveWords(words);
  }

  public async markAsCurrent(setId: string): Promise<void> {
    await apiService.markAsCurrent(setId);
  }

  public async markAsFinished(setId: string): Promise<void> {
    await apiService.markAsFinished(setId);
  }

  public async markAsTobe(wordIds: string[]): Promise<void> {
    await apiService.markAsTobe(wordIds);
  }
}
