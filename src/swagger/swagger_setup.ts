export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth, Users, Posts and Comments API",
      version: "1.0.0",
      description:
        "This is an API for managing Auth, Users, Posts and Comments functionality",
    },
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
            email: { type: "string" },
            password: { type: "string" },
            username: { type: "string" },
            refreshTokens: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["email", "password", "username"],
        },

        AuthRegisterRequest: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            username: { type: "string" },
          },
          required: ["email", "password", "username"],
        },

        AuthLoginRequest: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },

        AuthTokensResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
          required: ["accessToken", "refreshToken"],
        },

        Post: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            sender: { $ref: "#/components/schemas/User" },
          },
          required: ["title", "content", "sender"],
        },

        Comment: {
          type: "object",
          properties: {
            content: { type: "string" },
            userId: { $ref: "#/components/schemas/User" },
            postId: { $ref: "#/components/schemas/Post" },
          },
          required: ["content", "userId", "postId"],
        },
      },
    },

    paths: {
      "/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthRegisterRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "User completed registration",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
            500: {
              description: "Registration failed",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },

      "/auth/login": {
        post: {
          summary: "Login and receive access+refresh tokens",
          tags: ["auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthLoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login success",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokensResponse" },
                },
              },
            },
            500: {
              description: "Invalid Credentials",
              content: {
                "text/plain": {
                  schema: { type: "string" },
                },
              },
            },
          },
        },
      },

      "/auth/logout": {
        post: {
          summary: "Logout (invalidate refresh token)",
          tags: ["auth"],
          parameters: [
            {
              name: "Authorization",
              in: "header",
              required: true,
              description: "Bearer <refreshToken>",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Logged out",
              content: {
                "text/plain": { schema: { type: "string" } },
              },
            },
            401: {
              description: "Refresh token is not provided",
              content: {
                "text/plain": { schema: { type: "string" } },
              },
            },
            403: {
              description: "Unauthorized",
              content: {
                "text/plain": { schema: { type: "string" } },
              },
            },
          },
        },
      },

      "/auth/refresh-token": {
        post: {
          summary: "Refresh tokens (swap refresh token and issue new access token)",
          tags: ["auth"],
          parameters: [
            {
              name: "Authorization",
              in: "header",
              required: true,
              description: "Bearer <refreshToken>",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "New tokens returned",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthTokensResponse" },
                },
              },
            },
            401: {
              description: "Unauthorized (no token provided)",
              content: {
                "text/plain": { schema: { type: "string" } },
              },
            },
            403: {
              description: "Unauthorized",
              content: {
                "text/plain": { schema: { type: "string" } },
              },
            },
          },
        },
      },
      "/users": {
        get: {
          summary: "Get all users",
          tags: ["users"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "A list of users",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a new user",
          tags: ["users"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          responses: {
            201: {
              description: "User created",
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
        get: {
          summary: "Get user by ID",
          tags: ["users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              description: "The ID of the user",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "User found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            404: { description: "User not found" },
          },
        },
        put: {
          summary: "Update user by ID",
          tags: ["users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              description: "The ID of the user",
              schema: { type: "string" },
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
            404: { description: "User not found" },
          },
        },
        delete: {
          summary: "Delete user by ID",
          tags: ["users"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              description: "The ID of the user",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "User deleted" },
            404: { description: "User not found" },
          },
        },
      },

      "/posts": {
        get: {
          summary: "Get all posts",
          tags: ["posts"],
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              description: "The ID of the post",
              schema: { type: "string" },
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
            404: { description: "Post not found" },
          },
        },
        put: {
          summary: "Update post by ID",
          tags: ["posts"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              description: "The ID of the post",
              schema: { type: "string" },
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
            404: { description: "Post not found" },
          },
        },
      },

      "/comments": {
        get: {
          summary: "Get all comments",
          tags: ["comments"],
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
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
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              description: "The ID of the comment",
              schema: { type: "string" },
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
            404: { description: "Comment not found" },
          },
        },
        put: {
          summary: "Update comment by ID",
          tags: ["comments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              description: "The ID of the comment",
              schema: { type: "string" },
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
            404: { description: "Comment not found" },
          },
        },
      },

      "/comments/post/{postId}": {
        get: {
          summary: "Get comments by post ID",
          tags: ["comments"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              description: "The ID of the post",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Comments found",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Comment" },
                  },
                },
              },
            },
            404: { description: "No comments found for the given post" },
          },
        },
      },
    },
  },

  apis: ["./routes/*.ts"],
};
