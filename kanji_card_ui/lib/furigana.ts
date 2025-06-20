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

  try {
    const cleanReading = reading.replace("。", "").split(" ");
    const cleanOriginalText = originalText.replace("。", "").split(" ");

    const furi = cleanReading.map((element, index) => {
      const originalElement = cleanOriginalText[index];

      try {
        const furiganaText = fit(originalElement, element);
        if (furiganaText) {
          return furiganaText
        }
      } catch (error) {
        console.error('Error creating furigana:', error);
      }

      return element
    }).join(" ") + "。";

    if (furi && furi.length > 0) {
      return furi.replace(/([^\[]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>')
    }
  } catch (e) {
    console.error('Error creating furigana:', e);
  }

  return `<ruby>${originalText}<rt>${reading}</rt></ruby>`;
};