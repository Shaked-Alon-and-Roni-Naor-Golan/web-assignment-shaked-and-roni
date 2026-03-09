import queryParserService from "../../src/services/query_parser_service";
import llmClient from "../../src/services/llm_client";

describe("query_parser_service.parsePostQuery", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(queryParserService as any, "getKnownCitiesFromDatabase")
      .mockResolvedValue([
        "tel aviv",
        "jerusalem",
        "haifa",
        "eilat",
        "netanya",
        "tiberias",
        "ashdod",
        "beer sheva",
        "beersheba",
        "gedera",
      ]);
  });

  test("returns normalized LLM parse when available", async () => {
    jest.spyOn(llmClient, "generateJson").mockResolvedValueOnce({
      city: "Tel Aviv",
      pricePerNight: { min: 300, max: 700 },
      nights: { min: 2, max: 4 },
      searchType: "combined",
      confidence: 0.82,
    });

    const parsed = await queryParserService.parsePostQuery(
      "hotels in tel aviv between 300 and 700 for 2-4 nights",
      { fallbackToKeywords: true }
    );

    expect(parsed.pricePerNight).toEqual({ min: 300, max: 700 });
    expect(parsed.nights).toEqual({ min: 2, max: 4 });
    expect(parsed.city).toBe("Tel Aviv");
    expect(parsed.searchType).toBe("combined");
    expect(parsed.mongoFilter).toEqual({
      city: "tel aviv",
      pricePerNight: { $gte: 300, $lte: 700 },
      nights: { $gte: 2, $lte: 4 },
    });
    expect(parsed.confidence).toBe(0.82);
  });

  test("falls back to heuristic parsing when LLM fails", async () => {
    jest
      .spyOn(llmClient, "generateJson")
      .mockRejectedValueOnce(new Error("llm down"));

    const parsed = await queryParserService.parsePostQuery(
      "show me hotels in tel aviv under 800 for 3 nights",
      { fallbackToKeywords: true }
    );

    expect(parsed.city).toBe("tel aviv");
    expect(parsed.pricePerNight).toEqual({ max: 800 });
    expect(parsed.nights).toEqual({ min: 3, max: 3 });
    expect(parsed.searchType).toBe("combined");
    expect(parsed.confidence).toBe(0.3);
  });

  test("throws when query is empty", async () => {
    await expect(
      queryParserService.parsePostQuery("   ", { fallbackToKeywords: true })
    ).rejects.toThrow("non-empty string");
  });
});
