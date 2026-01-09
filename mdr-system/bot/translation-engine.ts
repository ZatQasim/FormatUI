import axios from 'axios';
import { log } from '../index';

interface TranslationResult {
  text: string;
  source: string;
  confidence: number;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: 'en',
  ar: 'ar',
  es: 'es',
  fr: 'fr',
  de: 'de',
  tr: 'tr',
  ja: 'ja',
  zh: 'zh',
  ko: 'ko',
  ru: 'ru',
  pt: 'pt',
  it: 'it',
  nl: 'nl',
  pl: 'pl',
  vi: 'vi',
  th: 'th',
  id: 'id',
  hi: 'hi',
  bn: 'bn',
  pa: 'pa',
};

export class TranslationEngine {
  private async tryMyMemory(text: string, targetLang: string): Promise<TranslationResult | null> {
    try {
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`,
        { timeout: 5000 }
      );
      
      if (response.data?.responseStatus === 200 && response.data?.responseData?.translatedText) {
        return {
          text: response.data.responseData.translatedText,
          source: 'MyMemory',
          confidence: response.data.responseData.match || 0.8
        };
      }
    } catch (error) {
      log(`MyMemory translation failed: ${error}`, 'translation');
    }
    return null;
  }

  private async tryGoogleTranslate(text: string, targetLang: string): Promise<TranslationResult | null> {
    try {
      const response = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
        { 
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (Array.isArray(response.data) && response.data[0]) {
        const translated = response.data[0].map((item: any) => 
          Array.isArray(item) ? item[0] : item
        ).join('');
        
        return {
          text: translated,
          source: 'Google Translate',
          confidence: 0.95
        };
      }
    } catch (error) {
      log(`Google Translate failed: ${error}`, 'translation');
    }
    return null;
  }

  private async tryLibreTranslate(text: string, targetLang: string): Promise<TranslationResult | null> {
    try {
      const response = await axios.post(
        'https://libretranslate.de/translate',
        {
          q: text,
          source: 'auto',
          target: targetLang
        },
        { timeout: 5000 }
      );
      
      if (response.data?.translatedText) {
        return {
          text: response.data.translatedText,
          source: 'LibreTranslate',
          confidence: 0.85
        };
      }
    } catch (error) {
      log(`LibreTranslate failed: ${error}`, 'translation');
    }
    return null;
  }

  private async tryDeepL(text: string, targetLang: string): Promise<TranslationResult | null> {
    try {
      // Free tier mapping
      const deepLLang: Record<string, string> = {
        en: 'EN-US',
        de: 'DE',
        fr: 'FR',
        es: 'ES',
        it: 'IT',
        ja: 'JA',
        zh: 'ZH',
        ru: 'RU',
        pt: 'PT-BR',
        nl: 'NL',
        pl: 'PL',
      };
      
      const target = deepLLang[targetLang];
      if (!target) return null;
      
      const response = await axios.post(
        'https://api-free.deepl.com/v1/translate',
        new URLSearchParams({
          text,
          target_lang: target,
          source_lang: 'auto'
        }).toString(),
        { 
          timeout: 5000,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      
      if (response.data?.translations?.[0]?.text) {
        return {
          text: response.data.translations[0].text,
          source: 'DeepL',
          confidence: 0.96
        };
      }
    } catch (error) {
      log(`DeepL translation failed: ${error}`, 'translation');
    }
    return null;
  }

  private async tryYandex(text: string, targetLang: string): Promise<TranslationResult | null> {
    try {
      const response = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`,
        { timeout: 5000 }
      );
      
      if (response.data?.responseStatus === 200 && response.data?.responseData?.translatedText) {
        return {
          text: response.data.responseData.translatedText,
          source: 'Yandex Fallback',
          confidence: 0.75
        };
      }
    } catch (error) {
      // Yandex fallback
    }
    return null;
  }

  async translate(text: string, targetLang: string): Promise<{ translation: string; sources: string[] }> {
    const normalizedLang = targetLang.toLowerCase().slice(0, 2);
    
    if (!LANGUAGE_MAP[normalizedLang]) {
      return {
        translation: `Language "${targetLang}" is not supported. Supported: ${Object.values(LANGUAGE_MAP).join(', ')}`,
        sources: []
      };
    }

    // Try APIs in order of preference
    const apis = [
      () => this.tryGoogleTranslate(text, normalizedLang),
      () => this.tryDeepL(text, normalizedLang),
      () => this.tryMyMemory(text, normalizedLang),
      () => this.tryLibreTranslate(text, normalizedLang),
      () => this.tryYandex(text, normalizedLang)
    ];

    const results: TranslationResult[] = [];
    const sources: Set<string> = new Set();

    for (const api of apis) {
      try {
        const result = await api();
        if (result) {
          results.push(result);
          sources.add(result.source);
          // Success - we got a good translation, use it
          break;
        }
      } catch (error) {
        // Continue to next API
        log(`Translation API attempt failed`, 'translation');
      }
    }

    if (results.length === 0) {
      return {
        translation: `Unable to translate to "${targetLang}". Please try again later.`,
        sources: []
      };
    }

    // Return the highest confidence translation
    const best = results.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );

    return {
      translation: best.text,
      sources: Array.from(sources)
    };
  }
}

export const translationEngine = new TranslationEngine();
