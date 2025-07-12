import { JapaneseWord, Set, Collection } from ".";
import { ExtractedWord as ApiExtractedWord, ExtractedWord, SetResponse, LearnSetState, WordOverview, WordResponse } from "../../../api";
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
      state: setResponse.state || '',
      timeToLearn: setResponse.time_to_learn || undefined,
      needToLearn: setResponse.need_to_learn,
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
    const response = await apiService.listReleasedWords(search);
    return response.map(x => this.mapWordResponseToJapaneseWord(x))
  }

  public async getTestWords(): Promise<JapaneseWord[]> {
    const response = await apiService.listTestReleasedWords();
    return response.map(x => this.mapWordResponseToJapaneseWord(x))
  }

  public async getInProgressSets(): Promise<{ needToLearn: Set[], toFeature: Set[], wordCountToLearn: number, wordCountToFeature: number }> {
    const response = await apiService.listCurrentSets();
    return {
      needToLearn: response.need_to_learn.map(x => this.mapSetResponseToSet(x)),
      toFeature: response.to_feature.map(x => this.mapSetResponseToSet(x)),
      wordCountToLearn: response.word_count_to_learn,
      wordCountToFeature: response.word_count_to_feature,
    };
  }

  public async getUnlearnedSets(): Promise<Set[]> {
    const response = await apiService.listTobeSets();
    return response.map(x => this.mapSetResponseToSet(x))
  }



  public async getOverview(): Promise<WordOverview> {
    return await apiService.getOverview();
  }


  public async getSetById(setId: string): Promise<Set | null> {
    const setResponse = await apiService.getSet(setId);
    return this.mapSetResponseToSet(setResponse);
  }

  private mapSetStateToCollection(state: LearnSetState): Collection {
    switch (state) {
      case LearnSetState.TOBE:
        return Collection.NEW;
      default:
        return Collection.IN_PROGRESS;
    }
  }

  private mapApiExtractedWordToExtractedWord(word: ApiExtractedWord): ExtractedWord {
    return {
      word: word.word,
      translation: word.translation
    };
  }

  public async extractWordsFromText(text: string): Promise<ExtractedWord[]> {
    const words = await apiService.extractWordsFromText(text);
    return words.map(this.mapApiExtractedWordToExtractedWord);
  }

  public async extractWordsFromImage(imageData: Uint8Array): Promise<ExtractedWord[]> {
    const words = await apiService.extractWordsFromImage(imageData);
    return words.map(this.mapApiExtractedWordToExtractedWord);
  }

  public async saveWords(words: ExtractedWord[]): Promise<void> {
    await apiService.saveWords(words);
  }



  public async markAsTobe(wordIds: string[]): Promise<void> {
    await apiService.markAsTobe(wordIds);
  }

  public async toNextLearnIter(setId: string): Promise<void> {
    await apiService.toNextLearnIter(setId);
  }
}
