import { PostModel } from "../models/posts_model";
import queryParserService from "./query_parser_service";

type SearchPostsParams = {
  query?: string;
  ownerId?: string;
  offset: number;
  limit?: number;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class PostSearchService {
  async searchPosts({
    query,
    ownerId,
    offset,
    limit = 3,
  }: SearchPostsParams) {
    const filter: any = {};

    if (ownerId) {
      filter.owner = ownerId;
    }

    const trimmedQuery = query?.trim();

    if (trimmedQuery) {
      const parsed = await queryParserService.parsePostQuery(trimmedQuery, {
        fallbackToKeywords: true,
        maxKeywords: 8,
      });

      const terms = [...parsed.keywords];
      if (parsed.city) {
        terms.push(parsed.city);
      }

      const uniqueTerms = Array.from(
        new Set(terms.map((term) => term.trim()).filter((term) => term.length > 0))
      );

      const searchTerms = uniqueTerms.length ? uniqueTerms : [trimmedQuery];

      filter.$or = searchTerms.map((term) => ({
        content: { $regex: escapeRegex(term), $options: "i" },
      }));
    }

    return PostModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("owner", "-tokens -email -password")
      .populate("likedBy")
      .populate({ path: "comments", populate: { path: "user" } });
  }
}

export default new PostSearchService();
