export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HotelLand API",
      version: "2.0.0",
      description: "API for authentication, posts, comments, users and AI for HotelLand application",
    },
    servers: [
      {
        url: "/api",
        description: "API base path",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            photo: { type: "string", nullable: true },
          },
          required: ["_id", "username", "email"],
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            content: { type: "string" },
            user: {
              anyOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
            },
          },
          required: ["_id", "content", "user"],
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string" },
            owner: {
              anyOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
            },
            content: { type: "string" },
            photoSrc: { type: "string" },
            city: { type: "string", nullable: true },
            pricePerNight: { type: "number", nullable: true },
            nights: { type: "number", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            likedBy: {
              type: "array",
              items: {
                anyOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }],
              },
            },
            comments: {
              type: "array",
              items: {
                anyOf: [{ type: "string" }, { $ref: "#/components/schemas/Comment" }],
              },
            },
          },
          required: ["_id", "owner", "content", "photoSrc"],
        },
        Token: {
          type: "object",
          properties: {
            token: { type: "string" },
            expireDate: { type: "string", format: "date-time" },
          },
          required: ["token", "expireDate"],
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { $ref: "#/components/schemas/Token" },
            refreshToken: { $ref: "#/components/schemas/Token" },
            user: { $ref: "#/components/schemas/User" },
          },
          required: ["accessToken", "refreshToken", "user"],
        },
        UpdateUserResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            accessToken: { $ref: "#/components/schemas/Token" },
            refreshToken: { $ref: "#/components/schemas/Token" },
          },
          required: ["user", "accessToken", "refreshToken"],
        },
      },
    },
    tags: [
      { name: "auth" },
      { name: "users" },
      { name: "posts" },
      { name: "comments" },
      { name: "ai" },
    ],
    paths: {
      "/auth/login": {
        post: {
          tags: ["auth"],
          summary: "Login with username/password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["username", "password"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            500: { description: "Invalid credentials or server error" },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    user: {
                      type: "string",
                      description: "JSON string: { username, email, password }",
                    },
                  },
                  required: ["user"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Registered and authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            400: { description: "Username/email already exists" },
            500: { description: "Server error" },
          },
        },
      },
      "/auth/google-login": {
        post: {
          tags: ["auth"],
          summary: "Login with Google credential",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    credential: { type: "string" },
                  },
                  required: ["credential"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            500: { description: "Failed to sign in google" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["auth"],
          summary: "Logout using token in Authorization header",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Logged out successfully" },
            401: { description: "No token provided" },
            403: { description: "Unauthorized" },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          tags: ["auth"],
          summary: "Refresh access token",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Refreshed successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthResponse" },
                },
              },
            },
            401: { description: "No token provided" },
            403: { description: "Unauthorized" },
          },
        },
      },
      "/users/me": {
        get: {
          tags: ["users"],
          summary: "Get current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Current user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            401: { description: "No token provided" },
            404: { description: "Cannot find specified user" },
          },
        },
      },
      "/users/{userId}": {
        put: {
          tags: ["users"],
          summary: "Update username/photo for a user",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    username: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "User updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UpdateUserResponse" },
                },
              },
            },
            400: { description: "Username already exists" },
            404: { description: "Cannot find specified user" },
          },
        },
      },
      "/posts": {
        get: {
          tags: ["posts"],
          summary: "List posts",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postOwner",
              in: "query",
              schema: { type: "string" },
            },
            {
              name: "offset",
              in: "query",
              schema: { type: "integer", default: 0 },
            },
            {
              name: "q",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Posts list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Post" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["posts"],
          summary: "Create post",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    post: {
                      type: "string",
                      description:
                        "JSON string with post payload (owner, content, city?, pricePerNight?, nights?)",
                    },
                  },
                  required: ["post"],
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created post",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Post" },
                },
              },
            },
          },
        },
      },
      "/posts/{postId}": {
        get: {
          tags: ["posts"],
          summary: "Get post by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Post details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Post" },
                },
              },
            },
            404: { description: "Cannot find specified post" },
          },
        },
        put: {
          tags: ["posts"],
          summary: "Update post or toggle like",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    updatedPostContent: {
                      type: "string",
                      description:
                        "JSON string with fields for content/city/pricePerNight/nights OR { userId } for like toggle",
                    },
                    content: { type: "string" },
                    city: { type: "string" },
                    pricePerNight: { type: "number" },
                    nights: { type: "number" },
                    userId: { type: "string" },
                  },
                },
              },
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    city: { type: "string" },
                    pricePerNight: { type: "number" },
                    nights: { type: "number" },
                    userId: { type: "string" },
                    updatedPostContent: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Updated post",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Post" },
                },
              },
            },
            403: { description: "You are not the owner of this post" },
            404: { description: "Cannot find specified post" },
          },
        },
        delete: {
          tags: ["posts"],
          summary: "Delete post by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "The post deleted" },
            404: { description: "Post not found" },
          },
        },
      },
      "/comments": {
        get: {
          tags: ["comments"],
          summary: "List comments",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "user",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Comments list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Comment" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["comments"],
          summary: "Create comment for post",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    postId: { type: "string" },
                    comment: {
                      type: "object",
                      properties: {
                        user: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["user", "content"],
                    },
                  },
                  required: ["postId", "comment"],
                },
              },
            },
          },
          responses: {
            201: {
              description: "Created comment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
          },
        },
      },
      "/comments/{commentId}": {
        get: {
          tags: ["comments"],
          summary: "Get comment by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Comment details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
            404: { description: "Comment not found" },
          },
        },
        put: {
          tags: ["comments"],
          summary: "Update comment by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Comment updated" },
            404: { description: "comment not found" },
          },
        },
        delete: {
          tags: ["comments"],
          summary: "Delete comment by id",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "The comment deleted" },
            404: { description: "Comment not found" },
          },
        },
      },
      "/ai/enhance": {
        post: {
          tags: ["ai"],
          summary: "Enhance review text",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reviewContent: { type: "string" },
                  },
                  required: ["reviewContent"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Enhanced review text",
              content: {
                "application/json": {
                  schema: { type: "string" },
                },
              },
            },
            400: { description: "Review content is required" },
            500: { description: "Failed to enhance review" },
          },
        },
      },
    },
  },
  apis: [],
};
