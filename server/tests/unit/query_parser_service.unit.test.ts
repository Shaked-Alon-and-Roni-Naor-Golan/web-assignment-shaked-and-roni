import queryParserService from "../../src/services/query_parser_service";
import llmClient from "../../src/services/llm_client";

describe("query_parser_service.parsePostQuery", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("returns normalized LLM parse when available", async () => {
    jest.spyOn(llmClient, "generateJson").mockResolvedValueOnce({
      keywords: ["luxury", "spa"],
      city: "Tel Aviv",
      searchType: "combined",
      confidence: 0.82,
    });

    const parsed = await queryParserService.parsePostQuery(
      "luxury spa hotels in tel aviv",
      { fallbackToKeywords: true, maxKeywords: 5 }
    );

    expect(parsed.keywords).toEqual(["luxury", "spa"]);
    expect(parsed.city).toBe("Tel Aviv");
    expect(parsed.searchType).toBe("combined");
    expect(parsed.confidence).toBe(0.82);
  });

  test("falls back to keyword parsing when LLM fails", async () => {
    jest
      .spyOn(llmClient, "generateJson")
      .mockRejectedValueOnce(new Error("llm down"));

    const parsed = await queryParserService.parsePostQuery(
      "show me hotels in tel aviv near beach",
      { fallbackToKeywords: true, maxKeywords: 5 }
    );

    expect(parsed.city).toBe("tel aviv");
    expect(parsed.keywords.length).toBeGreaterThan(0);
    expect(parsed.confidence).toBe(0.3);
  });

  test("throws when query is empty", async () => {
    await expect(
      queryParserService.parsePostQuery("   ", { fallbackToKeywords: true })
    ).rejects.toThrow("non-empty string");
  });
});
