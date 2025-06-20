import { fit } from 'furigana';

export const rubyStyles = `
  ruby {
    ruby-align: center;
    ruby-position: over;
  }
  rt {
    font-size: 0.6em;
    line-height: 1;
    text-align: center;
  }
`;

export function createFuriganaFromReading(originalText: string, reading: string): string {
  if (!originalText || !reading || originalText === reading) {
    return originalText;
  }

  // Check if the text contains kanji
  const hasKanji = /[\u4e00-\u9faf]/.test(originalText);
  if (!hasKanji) {
    return originalText;
  }

  const cleanReading = reading.replace("。", "");
  const cleanOriginalText = originalText.replace("。", "");

  try {
    const furiganaText = fit(cleanOriginalText, cleanReading);
    if (furiganaText) {
      return furiganaText.replace(/([^\[]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>') + "。";
    }
  } catch (error) {
    console.error('Error creating furigana:', error);
  }

  return `<ruby>${originalText}<rt>${reading}</rt></ruby>`;
};