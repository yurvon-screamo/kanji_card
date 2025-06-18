declare module 'kuroshiro' {
  interface ConvertOptions {
    to?: 'hiragana' | 'katakana' | 'romaji';
    mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
    romajiSystem?: 'nippon' | 'passport' | 'hepburn';
    delimiter_start?: string;
    delimiter_end?: string;
  }

  export default class Kuroshiro {
    constructor();
    init(analyzer: any): Promise<void>;
    convert(text: string, options?: ConvertOptions): Promise<string>;
  }
}