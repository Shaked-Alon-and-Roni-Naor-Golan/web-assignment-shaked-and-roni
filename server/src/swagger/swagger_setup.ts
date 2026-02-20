export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Just Eat API",
      version: "1.0.0",
      description: "API for managing resturant reviews",
    },
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            photoSrc: { type: "string" },
            username: { type: "string" },
          },
          required: ["email", "password", "username"],
        },
        Post: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            photoSrc: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            comments: { $ref: "#/components/schemas/Comment" },
            likedBy: {
              type: "array",
              $ref: "#/components/schemas/User",
            },
          },
          required: ["title", "content", "user"],
        },
        Comment: {
          type: "object",
          properties: {
            content: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
          required: ["content", "user"],
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
          required: ["accessToken", "refreshToken", "user"],
        },
      },
    },
    paths: {
      "/users/me": {
        get: {
          summary: "Get the current user",
          tags: ["users"],
          responses: {
            200: {
              description: "The current user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
      "/users/{userId}": {
        put: {
          summary: "Update user by ID",
          tags: ["users"],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              description: "The ID of the user",
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          responses: {
            200: {
              description: "User updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            404: {
              description: "User not found",
            },
          },
        },
      },
      "/posts": {
        get: {
          summary: "Get all posts",
          tags: ["posts"],
          parameters: [
            {
              name: "postOwner",
              in: "query",
              description: "Filter posts by the owner's username",
              required: false,
              schema: {
                type: "string",
              },
            },
            {
              name: "offset",
              in: "query",
              description: "The number of posts to skip (pagination)",
              required: false,
              schema: {
                type: "integer",
                default: 0,
              },
            },
          ],
          responses: {
            200: {
              description: "A list of posts",
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
          summary: "Create a new post",
          tags: ["posts"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Post" },
              },
            },
          },
          responses: {
            201: {
              description: "Post created",
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
          summary: "Get post by ID",
          tags: ["posts"],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              description: "The ID of the post",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            200: {
              description: "Post found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Post" },
                },
              },
            },
            404: {
              description: "Post not found",
            },
          },
        },
        put: {
          summary: "Update post by ID",
          tags: ["posts"],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              description: "The ID of the post",
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Post" },
              },
            },
          },
          responses: {
            200: {
              description: "Post updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Post" },
                },
              },
            },
            404: {
              description: "Post not found",
            },
          },
        },
        delete: {
          summary: "Delete post by ID",
          tags: ["posts"],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              description: "The ID of the post",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            200: {
              description: "Post deleted",
            },
            404: {
              description: "Post not found",
            },
          },
        },
      },
      "/comments": {
        get: {
          summary: "Get all comments",
          tags: ["comments"],
          responses: {
            200: {
              description: "A list of comments",
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
          summary: "Create a new comment",
          tags: ["comments"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Comment" },
              },
            },
          },
          responses: {
            201: {
              description: "Comment created",
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
          summary: "Get comment by ID",
          tags: ["comments"],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              description: "The ID of the comment",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            200: {
              description: "Comment found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
            404: {
              description: "Comment not found",
            },
          },
        },
        put: {
          summary: "Update comment by ID",
          tags: ["comments"],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              description: "The ID of the comment",
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Comment" },
              },
            },
          },
          responses: {
            200: {
              description: "Comment updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
            404: {
              description: "Comment not found",
            },
          },
        },
        delete: {
          summary: "Delete comment by ID",
          tags: ["comments"],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              description: "The ID of the comment",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            200: {
              description: "Comment deleted",
            },
            404: {
              description: "Comment not found",
            },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Login user",
          tags: ["auth"],
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
            "200": {
              description: "User logged in successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokens" },
                },
              },
            },
            "401": {
              description: "Invalid credentials",
            },
            "500": {
              description: "Internal server error",
            },
          },
        },
      },
      "/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          responses: {
            "200": {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokens" },
                },
              },
            },
            "400": {
              description: "User already exists",
            },
            "500": {
              description: "Internal server error",
            },
          },
        },
      },
      "/auth/logout": {
        post: {
          summary: "Logout user",
          tags: ["auth"],
          responses: {
            "200": {
              description: "User logged out successfully",
            },
            "401": {
              description: "No refresh token provided",
            },
            "403": {
              description: "Unauthorized",
            },
            "500": {
              description: "Internal server error",
            },
          },
        },
      },
      "/auth/refresh-token": {
        post: {
          summary: "Refresh authentication token",
          tags: ["auth"],
          responses: {
            "200": {
              description: "Token refreshed successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokens" },
                },
              },
            },
            "401": {
              description: "No refresh token provided",
            },
            "403": {
              description: "Unauthorized",
            },
            "500": {
              description: "Internal server error",
            },
          },
        },
      },
      "/auth/google-login": {
        post: {
          summary: "Login using Google",
          tags: ["auth"],
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
            "200": {
              description: "User logged in via Google successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokens" },
                },
              },
            },
            "500": {
              description: "Failed to sign in with Google",
            },
          },
        },
      },
      "/ai/enhance": {
        post: {
          summary: "Enhance a review",
          tags: ["ai"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reviewContent: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Review enhanced",
              content: {
                "application/json": {
                  enhancedContent: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },

  apis: ["./routes/*.ts"],
};
