import llmClient from "./llm_client";
import { PostModel } from "../models/posts_model";

type RangeFilter = {
  min?: number;
  max?: number;
};

export type ParsedPostQuery = {
  city?: string;
  pricePerNight?: RangeFilter;
  nights?: RangeFilter;
  searchType: "price" | "nights" | "city" | "combined";
  mongoFilter: Record<string, unknown>;
  confidence: number;
  originalQuery: string;
};

type ParseOptions = {
  fallbackToKeywords?: boolean;
};

type LLMParsedPostQuery = {
  city?: string;
  pricePerNight?: RangeFilter;
  nights?: RangeFilter;
  searchType?: "price" | "nights" | "city" | "combined";
  confidence?: number;
};

class QueryParserService {
  private readonly logPrefix = "[QueryParserService]";
  private readonly cityCacheTtlMs = 5 * 60 * 1000;
  private cachedCities: string[] = [];
  private cachedCitiesExpireAt = 0;
  private readonly baseSystemPrompt = `You parse hotel-related social media search queries into JSON.

Schema:
{
  "city": "optional city name",
  "pricePerNight": { "min": 0, "max": 0 },
  "nights": { "min": 0, "max": 0 },
  "searchType": "price|nights|city|combined",
  "confidence": 0.0
}

Rules:
- Extract city when explicit (example: Tel Aviv, Jerusalem, Eilat).
- Extract price range from terms like under/over/between/around budget expressions.
- Extract nights range from terms like 2 nights, 3-5 nights, up to 7 nights.
- Use combined when more than one of city/pricePerNight/nights is present.
- Confidence must be between 0 and 1.
- Return JSON only.

Examples:
User: "hotels in tel aviv"
JSON:
{
  "city": "tel aviv",
  "searchType": "city",
  "confidence": 0.9
}

User: "hotels under 700"
JSON:
{
  "pricePerNight": { "max": 700 },
  "searchType": "price",
  "confidence": 0.8
}

User: "for 3 to 5 nights"
JSON:
{
  "nights": { "min": 3, "max": 5 },
  "searchType": "nights",
  "confidence": 0.8
}

User: "eilat under 900 for 2 nights"
JSON:
{
  "city": "eilat",
  "pricePerNight": { "max": 900 },
  "nights": { "min": 2, "max": 2 },
  "searchType": "combined",
  "confidence": 0.9
}`;

  private buildSystemPrompt(knownCities: string[]) {
    if (knownCities.length === 0) {
      return this.baseSystemPrompt;
    }

    return `${this.baseSystemPrompt}

Known cities from database:
${knownCities.map((city) => `- ${city}`).join("\n")}

If a city is explicitly mentioned and matches one of the known cities, prefer that exact city value.`;
  }

  private async getKnownCitiesFromDatabase(): Promise<string[]> {
    const now = Date.now();
    if (this.cachedCities.length > 0 && now < this.cachedCitiesExpireAt) {
      return this.cachedCities;
    }

    if (PostModel.db.readyState !== 1) {
      return this.cachedCities;
    }

    try {
      const distinctCities = await PostModel.distinct("city", {
        city: { $exists: true, $ne: null },
      });

      const normalizedCities = distinctCities
        .map((city) => String(city).trim().toLowerCase())
        .filter((city) => city.length > 0);

      this.cachedCities = Array.from(new Set(normalizedCities));
      this.cachedCitiesExpireAt = now + this.cityCacheTtlMs;
      return this.cachedCities;
    } catch (error) {
      console.error(`${this.logPrefix} failed to fetch known cities from DB`, {
        error,
      });
      return this.cachedCities;
    }
  }

  async parsePostQuery(
    query: string,
    options: ParseOptions = {}
  ): Promise<ParsedPostQuery> {
    this.validateQuery(query);
    const knownCities = await this.getKnownCitiesFromDatabase();
    console.log(`${this.logPrefix} parsePostQuery input:`, {
      query: query.trim(),
      options,
      knownCitiesCount: knownCities.length,
    });

    try {
      const llmParsed = await llmClient.generateJson<LLMParsedPostQuery>({
        systemPrompt: this.buildSystemPrompt(knownCities),
        userPrompt: `Parse this query: "${query.trim()}"`,
      });

      const parsedResult = this.toParsedResult(llmParsed, query);
      console.log(`${this.logPrefix} LLM parsed result:`, parsedResult);
      return parsedResult;
    } catch (error) {
      console.error(`${this.logPrefix} LLM parsing failed, using fallback`, {
        error,
      });
      if (options.fallbackToKeywords === false) {
        throw error;
      }
      const fallbackResult = this.fallbackHeuristicParsing(query, knownCities);
      console.log(`${this.logPrefix} Fallback parsed result:`, fallbackResult);
      return fallbackResult;
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
    originalQuery: string
  ): ParsedPostQuery {
    const city = llmParsed.city?.trim();
    const pricePerNight = this.normalizeRange(llmParsed.pricePerNight);
    const nights = this.normalizeRange(llmParsed.nights);
    const searchType =
      llmParsed.searchType || this.inferSearchType({ city, pricePerNight, nights });

    const result: ParsedPostQuery = {
      city: city || undefined,
      pricePerNight,
      nights,
      searchType,
      mongoFilter: this.toMongoFilter({ city, pricePerNight, nights }),
      confidence: this.normalizeConfidence(llmParsed.confidence),
      originalQuery: originalQuery.trim(),
    };

    return result;
  }

  private inferSearchType({
    city,
    pricePerNight,
    nights,
  }: {
    city?: string;
    pricePerNight?: RangeFilter;
    nights?: RangeFilter;
  }): ParsedPostQuery["searchType"] {
    const activeFilters = [
      Boolean(city),
      Boolean(pricePerNight),
      Boolean(nights),
    ].filter(Boolean).length;

    if (activeFilters > 1) {
      return "combined";
    }

    if (pricePerNight) {
      return "price";
    }

    if (nights) {
      return "nights";
    }

    return "city";
  }

  private normalizeRange(range?: RangeFilter): RangeFilter | undefined {
    if (!range) {
      return undefined;
    }

    const min =
      typeof range.min === "number" && Number.isFinite(range.min)
        ? range.min
        : undefined;
    const max =
      typeof range.max === "number" && Number.isFinite(range.max)
        ? range.max
        : undefined;

    if (min === undefined && max === undefined) {
      return undefined;
    }

    return {
      min,
      max,
    };
  }

  private toMongoFilter({
    city,
    pricePerNight,
    nights,
  }: {
    city?: string;
    pricePerNight?: RangeFilter;
    nights?: RangeFilter;
  }) {
    const filter: Record<string, unknown> = {};

    if (city) {
      filter.city = city.trim().toLowerCase();
    }

    if (pricePerNight) {
      const priceFilter: Record<string, number> = {};
      if (pricePerNight.min !== undefined) {
        priceFilter.$gte = pricePerNight.min;
      }
      if (pricePerNight.max !== undefined) {
        priceFilter.$lte = pricePerNight.max;
      }

      if (Object.keys(priceFilter).length > 0) {
        filter.pricePerNight = priceFilter;
      }
    }

    if (nights) {
      const nightsFilter: Record<string, number> = {};
      if (nights.min !== undefined) {
        nightsFilter.$gte = nights.min;
      }
      if (nights.max !== undefined) {
        nightsFilter.$lte = nights.max;
      }

      if (Object.keys(nightsFilter).length > 0) {
        filter.nights = nightsFilter;
      }
    }

    return filter;
  }

  private normalizeConfidence(confidence?: number) {
    if (typeof confidence !== "number") {
      return 0.4;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private fallbackHeuristicParsing(
    query: string,
    knownCities: string[]
  ): ParsedPostQuery {
    const trimmedQuery = query.trim();
    const normalized = trimmedQuery.toLowerCase();

    const city = knownCities.find((cityName) => normalized.includes(cityName));
    const pricePerNight = this.parsePriceRange(normalized);
    const nights = this.parseNightsRange(normalized);

    return {
      city,
      pricePerNight,
      nights,
      searchType: this.inferSearchType({ city, pricePerNight, nights }),
      mongoFilter: this.toMongoFilter({ city, pricePerNight, nights }),
      confidence: 0.3,
      originalQuery: trimmedQuery,
    };
  }

  private parsePriceRange(normalizedQuery: string): RangeFilter | undefined {
    const betweenMatch = normalizedQuery.match(/between\s+(\d+)\s+(?:and|to)\s+(\d+)/i);
    if (betweenMatch) {
      return {
        min: Number(betweenMatch[1]),
        max: Number(betweenMatch[2]),
      };
    }

    const rangeMatch = normalizedQuery.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:ils|nis|usd|dollars|\$)?/i);
    if (rangeMatch) {
      return {
        min: Number(rangeMatch[1]),
        max: Number(rangeMatch[2]),
      };
    }

    const underMatch = normalizedQuery.match(/(?:under|below|up to|max(?:imum)?|at most)\s+(\d+)/i);
    if (underMatch) {
      return {
        max: Number(underMatch[1]),
      };
    }

    const overMatch = normalizedQuery.match(/(?:over|above|from|minimum|min(?:imum)?|at least)\s+(\d+)/i);
    if (overMatch) {
      return {
        min: Number(overMatch[1]),
      };
    }

    return undefined;
  }

  private parseNightsRange(normalizedQuery: string): RangeFilter | undefined {
    const betweenMatch = normalizedQuery.match(
      /between\s+(\d+)\s+(?:and|to)\s+(\d+)\s+nights?/i
    );
    if (betweenMatch) {
      return {
        min: Number(betweenMatch[1]),
        max: Number(betweenMatch[2]),
      };
    }

    const rangeMatch = normalizedQuery.match(/(\d+)\s*[-–]\s*(\d+)\s+nights?/i);
    if (rangeMatch) {
      return {
        min: Number(rangeMatch[1]),
        max: Number(rangeMatch[2]),
      };
    }

    const exactMatch = normalizedQuery.match(/(?:for|of)?\s*(\d+)\s+nights?/i);
    if (exactMatch) {
      const value = Number(exactMatch[1]);
      return {
        min: value,
        max: value,
      };
    }

    const underMatch = normalizedQuery.match(/(?:up to|max(?:imum)?|at most)\s+(\d+)\s+nights?/i);
    if (underMatch) {
      return {
        max: Number(underMatch[1]),
      };
    }

    const overMatch = normalizedQuery.match(/(?:at least|min(?:imum)?|over)\s+(\d+)\s+nights?/i);
    if (overMatch) {
      return {
        min: Number(overMatch[1]),
      };
    }

    return undefined;
  }
}

export default new QueryParserService();
