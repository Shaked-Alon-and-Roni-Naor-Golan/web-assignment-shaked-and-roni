const mockGenerateContent = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
}));

import { enhanceReview } from "../../src/controllers/ai_controller";

describe("ai_controller.enhanceReview", () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when review content is missing", async () => {
    const req: any = { body: {} };
    const res = mockRes();

    await enhanceReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Review content is required");
  });

  test("returns enhanced text on success", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => JSON.stringify({ text: "Enhanced review" }) },
    });

    const req: any = { body: { reviewContent: "good movie" } };
    const res = mockRes();

    await enhanceReview(req, res);

    expect(mockGenerateContent).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith("Enhanced review");
  });

  test("returns 500 when generator fails", async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("Gemini down"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const req: any = { body: { reviewContent: "text" } };
    const res = mockRes();

    await enhanceReview(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Failed to enhance review: Gemini down");
    expect(errorSpy).toHaveBeenCalled();
  });
});
