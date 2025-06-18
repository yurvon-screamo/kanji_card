import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

// Глобальные переменные для kuroshiro
let kuroshiroInstance: Kuroshiro | null = null;
let isKuroshiroLoading = false;

// CSS стили для ruby элементов (фуригана)
export const rubyStyles = `
  ruby {
    ruby-align: center;
    ruby-position: over;
  }
  rt {
    font-size: 0.6em;
    line-height: 1;
    text-align: center;
    color: #666;
    font-weight: normal;
  }
  rp {
    display: none;
  }
`;

// Инициализация kuroshiro
const initKuroshiro = async () => {
  if (kuroshiroInstance) return kuroshiroInstance;
  if (isKuroshiroLoading) {
    // Ждем завершения текущей инициализации
    while (isKuroshiroLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return kuroshiroInstance;
  }

  isKuroshiroLoading = true;
  try {
    const kuroshiro = new Kuroshiro();
    // Используем локальные файлы словаря, скопированные в public директорию
    const analyzer = new KuromojiAnalyzer({
      dictPath: "/dict/"
    });
    await kuroshiro.init(analyzer);
    kuroshiroInstance = kuroshiro;
    return kuroshiroInstance;
  } catch (error) {
    console.error('Failed to initialize kuroshiro:', error);
    kuroshiroInstance = null;
    return null;
  } finally {
    isKuroshiroLoading = false;
  }
};

// Функция для добавления фуриганы к японскому тексту
export const addFurigana = async (text: string, cache: { [key: string]: string }): Promise<string> => {
  // Проверяем кэш
  if (cache[text]) {
    return cache[text];
  }

  if (!kuroshiroInstance) {
    const instance = await initKuroshiro();
    if (!instance) {
      return text; // Возвращаем оригинальный текст если kuroshiro не готов
    }
  }

  try {
    const result = await kuroshiroInstance!.convert(text, {
      mode: 'furigana',
      to: 'hiragana'
    });

    // Кэшируем результат
    cache[text] = result;
    return result;
  } catch (error) {
    console.error('Error converting to furigana:', error);
    return text;
  }
};

// Проверка готовности kuroshiro
export const isKuroshiroReady = async (): Promise<boolean> => {
  if (kuroshiroInstance) return true;

  const instance = await initKuroshiro();
  return !!instance;
};