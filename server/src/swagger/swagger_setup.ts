export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Posts API",
      version: "1.0.0",
      description: "API for managing posts",
    },
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            username: { type: "string" },
          },
          required: ["email", "password", "username"],
        },
        Post: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            user: { $ref: "#/components/schemas/User" }, // Referencing User schema
          },
          required: ["title", "content", "user"],
        },
        Comment: {
          type: "object",
          properties: {
            content: { type: "string" },
            user: { $ref: "#/components/schemas/User" }, // Referencing User schema
            post: { $ref: "#/components/schemas/Post" }, // Referencing Post schema
          },
          required: ["content", "user", "post"],
        },
      },
    },
    paths: {
      "/users": {
        get: {
          summary: "Get all users",
          responses: {
            200: {
              description: "A list of users",
              tags: ["users"],
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
          responses: {
            200: {
              description: "User found",
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
        delete: {
          summary: "Delete user by ID",
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
          responses: {
            200: {
              description: "User deleted",
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
      },
      "/comments/post/{postId}": {
        get: {
          summary: "Get comments by post ID",
          tags: ["comments"],
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
            404: {
              description: "No comments found for the given post",
            },
          },
        },
      },
    },
  },
  // Path to the API specs
  apis: ["./routes/*.ts"],
};
