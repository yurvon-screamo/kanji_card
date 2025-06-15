import { JapaneseWord, Set, Collection } from "../types";
import { ExtractedWord, SetState, WordOverview, WordResponse } from "../../../api";
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

  private async getWordsByState(state: SetState): Promise<JapaneseWord[]> {
    const setIds = await apiService.getListSets(state);
    const allWords: JapaneseWord[] = [];

    for (const setId of setIds) {
      const setResponse = await apiService.getSet(setId);
      const words = setResponse.words.map((w) =>
        this.mapWordResponseToJapaneseWord(w),
      );
      allWords.push(...words);
    }

    return allWords;
  }

  public async getLearnedWords(): Promise<JapaneseWord[]> {
    return this.getWordsByState(SetState.FINISHED);
  }

  public async getInProgressWords(): Promise<JapaneseWord[]> {
    return this.getWordsByState(SetState.CURRENT);
  }

  public async getUnlearnedWords(): Promise<JapaneseWord[]> {
    return this.getWordsByState(SetState.TOBE);
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

  public async getSetsByState(state: SetState): Promise<Set[]> {
    const setIds = await apiService.getListSets(state);
    const sets: Set[] = [];

    for (const setId of setIds) {
      const setResponse = await apiService.getSet(setId);
      const mappedSet: Set = {
        id: setResponse.id,
        words: setResponse.words.map((w) =>
          this.mapWordResponseToJapaneseWord(w),
        ),
        state: this.mapSetStateToCollection(setResponse.state),
      };
      sets.push(mappedSet);
    }

    return sets;
  }

  public async getSetById(setId: string): Promise<Set | null> {
    const setResponse = await apiService.getSet(setId);
    return {
      id: setResponse.id,
      words: setResponse.words.map((w) =>
        this.mapWordResponseToJapaneseWord(w),
      ),
      state: this.mapSetStateToCollection(setResponse.state),
    };
  }

  private mapSetStateToCollection(state: SetState): Collection {
    switch (state) {
      case SetState.FINISHED:
        return Collection.LEARNED;
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

  public async markAsTobe(setId: string): Promise<void> {
    await apiService.markAsTobe(setId);
  }
}
