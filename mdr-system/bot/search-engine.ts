import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  category: 'web' | 'news' | 'code';
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://duckduckgo.com/',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    $('.result').each((index, element) => {
      const titleEl = $(element).find('.result__title a');
      const snippetEl = $(element).find('.result__snippet');
      const urlEl = $(element).find('.result__url');

      const title = titleEl.text().trim();
      const description = snippetEl.text().trim();
      let url = urlEl.text().trim();

      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      // Filter out duckduckgo's internal/ad results if they don't have descriptions
      if (title && description && !url.includes('duckduckgo.com/y.js')) {
        let category: 'web' | 'news' | 'code' = 'web';
        if (url.includes('github.com') || url.includes('stackoverflow.com')) {
          category = 'code';
        } else if (url.includes('news') || url.includes('bbc') || url.includes('cnn')) {
          category = 'news';
        }

        results.push({
          title,
          url,
          description,
          category,
        });
      }
    });

    // Sort and limit after collecting all genuine results
    return results.slice(0, 5);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}
