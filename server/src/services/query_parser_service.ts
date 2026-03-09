import llmClient from "./llm_client";

export type ParsedPostQuery = {
  keywords: string[];
  city?: string;
  searchType: "keyword" | "city" | "combined" | "semantic";
  confidence: number;
  originalQuery: string;
};

type ParseOptions = {
  fallbackToKeywords?: boolean;
  maxKeywords?: number;
};

type LLMParsedPostQuery = {
  keywords?: string[];
  city?: string;
  searchType?: "keyword" | "city" | "combined" | "semantic";
  confidence?: number;
};

class QueryParserService {
  private readonly systemPrompt = `You parse hotel-related social media search queries into JSON.

Schema:
{
  "keywords": ["word1", "word2"],
  "city": "optional city name",
  "searchType": "keyword|city|combined|semantic",
  "confidence": 0.0
}

Rules:
- Keep keywords short and relevant to hotels/travel/accommodation.
- Extract city when explicit (example: Tel Aviv, Jerusalem, Eilat).
- If city and keywords both exist, use combined.
- Confidence must be between 0 and 1.
- Return JSON only.`;

  async parsePostQuery(
    query: string,
    options: ParseOptions = {}
  ): Promise<ParsedPostQuery> {
    this.validateQuery(query);

    try {
      const llmParsed = await llmClient.generateJson<LLMParsedPostQuery>({
        systemPrompt: this.systemPrompt,
        userPrompt: `Parse this query: "${query.trim()}"`,
      });

      return this.toParsedResult(llmParsed, query, options.maxKeywords);
    } catch (error) {
      if (options.fallbackToKeywords === false) {
        throw error;
      }
      return this.fallbackKeywordParsing(query, options.maxKeywords);
    }
  }

  private validateQuery(query: string) {
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      throw new Error("Query must be a non-empty string");
    }

    if (query.trim().length > 300) {
      throw new Error("Query too long (max 300 characters)");
    }
  }

  private toParsedResult(
    llmParsed: LLMParsedPostQuery,
    originalQuery: string,
    maxKeywords?: number
  ): ParsedPostQuery {
    let keywords = Array.isArray(llmParsed.keywords)
      ? llmParsed.keywords
          .map((keyword) => String(keyword).trim())
          .filter((keyword) => keyword.length > 0)
      : [];

    if (maxKeywords && keywords.length > maxKeywords) {
      keywords = keywords.slice(0, maxKeywords);
    }

    const city = llmParsed.city?.trim();

    const result: ParsedPostQuery = {
      keywords,
      city: city || undefined,
      searchType: llmParsed.searchType || this.inferSearchType(keywords, city),
      confidence: this.normalizeConfidence(llmParsed.confidence),
      originalQuery: originalQuery.trim(),
    };

    return result;
  }

  private inferSearchType(
    keywords: string[],
    city?: string
  ): ParsedPostQuery["searchType"] {
    if (keywords.length && city) {
      return "combined";
    }

    if (city) {
      return "city";
    }

    if (keywords.length > 2) {
      return "semantic";
    }

    return "keyword";
  }

  private normalizeConfidence(confidence?: number) {
    if (typeof confidence !== "number") {
      return 0.4;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private fallbackKeywordParsing(
    query: string,
    maxKeywords?: number
  ): ParsedPostQuery {
    const trimmedQuery = query.trim();
    const normalized = trimmedQuery.toLowerCase();

    const knownCities = [
      "tel aviv",
      "jerusalem",
      "haifa",
      "eilat",
      "netanya",
      "tiberias",
      "nazareth",
      "ashdod",
      "beer sheva",
      "beersheba",
    ];

    const city = knownCities.find((cityName) => normalized.includes(cityName));

    let keywords = normalized
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !["hotel", "hotels", "with", "from", "that", "are", "the"].includes(word));

    if (maxKeywords && keywords.length > maxKeywords) {
      keywords = keywords.slice(0, maxKeywords);
    }

    return {
      keywords,
      city,
      searchType: this.inferSearchType(keywords, city),
      confidence: 0.3,
      originalQuery: trimmedQuery,
    };
  }
}

export default new QueryParserService();
