import { PostModel } from "../models/posts_model";
import queryParserService from "./query_parser_service";

type SearchPostsParams = {
  query?: string;
  ownerId?: string;
  offset: number;
  limit?: number;
};

class PostSearchService {
  async searchPosts({
    query,
    ownerId,
    offset,
    limit = 3,
  }: SearchPostsParams) {
    const filter: Record<string, unknown> = {};
    console.log("[PostSearchService] searchPosts called", {
      query,
      ownerId,
      offset,
      limit,
    });

    if (ownerId) {
      filter.owner = ownerId;
    }

    const trimmedQuery = query?.trim();

    if (trimmedQuery) {
      const parsed = await queryParserService.parsePostQuery(trimmedQuery, {
        fallbackToKeywords: true,
      });
      console.log("[PostSearchService] parsed query result", parsed);
      Object.assign(filter, parsed.mongoFilter);
    }

    console.log("[PostSearchService] final mongo filter", filter);

    const posts = await PostModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("owner", "-tokens -email -password")
      .populate("likedBy")
      .populate({ path: "comments", populate: { path: "user" } });

    console.log("[PostSearchService] matched posts", {
      count: posts.length,
    });

    return posts;
  }
}

export default new PostSearchService();
