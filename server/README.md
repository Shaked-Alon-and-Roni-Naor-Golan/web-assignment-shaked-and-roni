# web-assignment-shaked-and-roni

This is a full-stack hotels social web project with both client and server sides.
The frontend (React client) lets users browse the feed, publish hotel posts, like, comment, and manage their profile.
This README focuses on the backend API (`server`) used by that client.

---

## Features

- Full-Stack App
  - Client side (React) for UI, pages, forms, and user interactions
  - Server side (Node.js + Express + MongoDB) for authentication, data, and API endpoints

- Hotel Posts
  - Share a hotel post with text and image
  - View all posts feed with pagination
  - View a single post with owner, likes, and comments
  - View only a specific user's posts (`postOwner`) for profile page
  - Edit post content/image (post owner)
  - Delete a post
  - Like / unlike a post (toggle via update endpoint)

- Comments
  - Add a comment to a specific post
  - Get all comments
  - Get a single comment by ID
  - Update a comment
  - Delete a comment

- Profile
  - Get current authenticated user (`/users/me`)
  - Update user profile details and profile photo

- Authentication
  - Register a new account (username, email, password)
  - Login with username/password
  - Login with Google
  - Refresh access token
  - Logout

## Current API Routes

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/google-login`
  - `POST /auth/refresh-token`
  - `POST /auth/logout`

- Posts
  - `GET /posts`
  - `GET /posts?postOwner=<userId>&offset=<number>`
  - `GET /posts/:postId`
  - `POST /posts`
  - `PUT /posts/:postId`
  - `DELETE /posts/:postId`

- Comments
  - `GET /comments`
  - `GET /comments/:commentId`
  - `POST /comments`
  - `PUT /comments/:commentId`
  - `DELETE /comments/:commentId`

- Users
  - `GET /users/me`
  - `PUT /users/:userId`

- AI
  - `POST /ai/enhance`

---

## Installation & Run

# Install dependencies
npm install

# Start the server
npm run start

# Start the client
npm run dev

# Run Integration Tests
npm test

---

## API Documentation

Interactive API documentation is available via Swagger at:
http://localhost:3000/api-docs