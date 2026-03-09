import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import app from "../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user_model";
import { PostModel } from "../src/models/posts_model";
import queryParserService from "../src/services/query_parser_service";

type DbUser = {
  _id: string;
  username: string;
  email: string;
};

const uniqueSuffix = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createUser = async (prefix = "post"): Promise<DbUser> => {
  const suffix = uniqueSuffix();
  const user = await UserModel.create({
    username: `${prefix}_${suffix}`,
    email: `${prefix}_${suffix}@test.com`,
    password: "password123",
    tokens: [],
  });

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
  };
};

const tokenFor = (user: DbUser) =>
  jwt.sign(
    { _id: user._id, username: user.username, email: user.email },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as string }
  );

describe("Posts API", () => {
  const createdUserIds = new Set<string>();
  const createdPostIds = new Set<string>();

  const trackPost = async (post: {
    owner: string;
    content: string;
    photoSrc?: string;
    city?: string;
    pricePerNight?: number;
    nights?: number;
    likedBy?: string[];
    comments?: string[];
  }) => {
    const created = await PostModel.create(post);
    createdPostIds.add(created._id.toString());
    return created;
  };

  beforeAll(async () => {
    await app;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (createdPostIds.size > 0) {
      await PostModel.deleteMany({ _id: { $in: Array.from(createdPostIds) } });
      createdPostIds.clear();
    }

    if (createdUserIds.size > 0) {
      await UserModel.deleteMany({ _id: { $in: Array.from(createdUserIds) } });
      createdUserIds.clear();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("GET /posts without token returns 401", async () => {
    const res = await request(await app).get("/posts");

    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("No token");
  });

  test("GET /posts returns posts", async () => {
    const owner = await createUser("owner");
    createdUserIds.add(owner._id);
    const token = tokenFor(owner);

    await trackPost({
      owner: owner._id,
      content: "A hotel review",
      photoSrc: "poster.jpg",
    });

    const res = await request(await app)
      .get("/posts")
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("content");
  });

  test("GET /posts?postOwner filters by owner", async () => {
    const owner = await createUser("owner_filter");
    const other = await createUser("other_filter");
    createdUserIds.add(owner._id);
    createdUserIds.add(other._id);
    const token = tokenFor(owner);

    await trackPost({
      owner: owner._id,
      content: "Owner post",
      photoSrc: "owner.jpg",
    });
    await trackPost({
      owner: other._id,
      content: "Other post",
      photoSrc: "other.jpg",
    });

    const res = await request(await app)
      .get(`/posts?postOwner=${owner._id}&offset=0`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].owner._id).toBe(owner._id);
  });

  test("GET /posts?q filters posts by city", async () => {
    const owner = await createUser("owner_search");
    createdUserIds.add(owner._id);
    const token = tokenFor(owner);

    jest.spyOn(queryParserService, "parsePostQuery").mockResolvedValueOnce({
      city: "tel aviv",
      searchType: "city",
      mongoFilter: { city: "tel aviv" },
      confidence: 0.9,
      originalQuery: "hotels in tel aviv",
    });

    await trackPost({
      owner: owner._id,
      city: "tel aviv",
      pricePerNight: 500,
      nights: 2,
      content: "Amazing boutique hotel near the beach",
      photoSrc: "ta.jpg",
    });

    await trackPost({
      owner: owner._id,
      city: "haifa",
      pricePerNight: 500,
      nights: 2,
      content: "Great cabin in the Golan",
      photoSrc: "golan.jpg",
    });

    const res = await request(await app)
      .get(`/posts?q=hotels%20in%20tel%20aviv&postOwner=${owner._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].city).toBe("tel aviv");
  });

  test("GET /posts?q filters posts by price range", async () => {
    const owner = await createUser("owner_price_range");
    createdUserIds.add(owner._id);
    const token = tokenFor(owner);

    jest.spyOn(queryParserService, "parsePostQuery").mockResolvedValueOnce({
      searchType: "price",
      pricePerNight: { min: 300, max: 700 },
      mongoFilter: { pricePerNight: { $gte: 300, $lte: 700 } },
      confidence: 0.86,
      originalQuery: "hotels between 300 and 700",
    });

    await trackPost({
      owner: owner._id,
      city: "tel aviv",
      pricePerNight: 550,
      nights: 2,
      content: "Great hotel in Tel Aviv with sea view",
      photoSrc: "in-range.jpg",
    });

    await trackPost({
      owner: owner._id,
      city: "tel aviv",
      pricePerNight: 900,
      nights: 2,
      content: "Luxury hotel in Tel Aviv",
      photoSrc: "out-range.jpg",
    });

    const res = await request(await app)
      .get(`/posts?q=hotels%20between%20300%20and%20700&postOwner=${owner._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].pricePerNight).toBe(550);
  });

  test("GET /posts?q filters posts by nights range", async () => {
    const owner = await createUser("owner_nights_range");
    createdUserIds.add(owner._id);
    const token = tokenFor(owner);

    jest.spyOn(queryParserService, "parsePostQuery").mockResolvedValueOnce({
      searchType: "nights",
      nights: { min: 2, max: 4 },
      mongoFilter: { nights: { $gte: 2, $lte: 4 } },
      confidence: 0.77,
      originalQuery: "for 2-4 nights",
    });

    await trackPost({
      owner: owner._id,
      city: "haifa",
      pricePerNight: 450,
      nights: 3,
      content: "Affordable hotel in Haifa city center",
      photoSrc: "haifa-center.jpg",
    });

    await trackPost({
      owner: owner._id,
      city: "haifa",
      pricePerNight: 450,
      nights: 6,
      content: "Affordable hotel for long stay",
      photoSrc: "haifa-long.jpg",
    });

    const res = await request(await app)
      .get(`/posts?q=for%202-4%20nights&postOwner=${owner._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nights).toBe(3);
  });

  test("GET /posts?q supports combined city and price filters", async () => {
    const owner = await createUser("owner_combined");
    createdUserIds.add(owner._id);
    const token = tokenFor(owner);

    jest.spyOn(queryParserService, "parsePostQuery").mockResolvedValueOnce({
      city: "eilat",
      pricePerNight: { max: 700 },
      searchType: "combined",
      mongoFilter: {
        city: "eilat",
        pricePerNight: { $lte: 700 },
      },
      confidence: 0.9,
      originalQuery: "eilat under 700",
    });

    await trackPost({
      owner: owner._id,
      city: "eilat",
      pricePerNight: 650,
      nights: 2,
      content: "Best hotel in Eilat near the beach",
      photoSrc: "eilat-beach.jpg",
    });

    await trackPost({
      owner: owner._id,
      city: "eilat",
      pricePerNight: 900,
      nights: 2,
      content: "Premium suite in Eilat",
      photoSrc: "eilat-premium.jpg",
    });

    const res = await request(await app)
      .get(`/posts?q=eilat%20under%20700&postOwner=${owner._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].city).toBe("eilat");
    expect(res.body[0].pricePerNight).toBe(650);
  });

  test("PUT /posts/:postId toggles like for user", async () => {
    const owner = await createUser("owner_like");
    const liker = await createUser("liker");
    createdUserIds.add(owner._id);
    createdUserIds.add(liker._id);

    const ownerToken = tokenFor(owner);

    const post = await trackPost({
      owner: owner._id,
      content: "Likeable hotel post",
      photoSrc: "like.jpg",
      likedBy: [],
    });

    const likeRes = await request(await app)
      .put(`/posts/${post._id}`)
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ userId: liker._id });

    expect(likeRes.statusCode).toBe(200);
    expect(likeRes.body.likedBy.length).toBe(1);

    const unlikeRes = await request(await app)
      .put(`/posts/${post._id}`)
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ userId: liker._id });

    expect(unlikeRes.statusCode).toBe(200);
    expect(unlikeRes.body.likedBy.length).toBe(0);
  });

  test("PUT /posts/:postId forbids content update for non-owner", async () => {
    const owner = await createUser("owner_edit");
    const notOwner = await createUser("not_owner");
    createdUserIds.add(owner._id);
    createdUserIds.add(notOwner._id);

    const nonOwnerToken = tokenFor(notOwner);

    const post = await trackPost({
      owner: owner._id,
      content: "Original content",
      photoSrc: "orig.jpg",
    });

    const res = await request(await app)
      .put(`/posts/${post._id}`)
      .set("authorization", `Bearer ${nonOwnerToken}`)
      .send({ updatedPostContent: JSON.stringify({ content: "Hacked" }) });

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("not the owner");
  });

  test("DELETE /posts/:postId deletes post", async () => {
    const owner = await createUser("owner_delete");
    createdUserIds.add(owner._id);
    const token = tokenFor(owner);

    const post = await trackPost({
      owner: owner._id,
      content: "Delete me",
      photoSrc: "delete.jpg",
    });

    const res = await request(await app)
      .delete(`/posts/${post._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const deleted = await PostModel.findById(post._id);
    expect(deleted).toBeNull();
  });

  test("GET /posts/:postId returns 404 for missing post", async () => {
    const user = await createUser("owner_missing");
    createdUserIds.add(user._id);
    const token = tokenFor(user);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await app)
      .get(`/posts/${fakeId}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});
