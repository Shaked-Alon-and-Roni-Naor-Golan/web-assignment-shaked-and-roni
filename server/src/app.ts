import { authenticateToken } from "./middlewares/auth_middleware";
import { swaggerOptions } from "./swagger/swagger_setup";

import * as path from "path";
const dotenv = require("dotenv");
const morgan = require("morgan");
const express = require("express");
const crossOrigin = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const specs = swaggerJsdoc(swaggerOptions);
const mongoUri = process.env.DB_CONNECT;

const appPromise: Promise<any> = new Promise((resolve, reject) => {
  if (!mongoUri) {
    return reject(
      new Error("Missing MongoDB URI. Set DB_CONNECT in server/.env")
    );
  }

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("Connected to database successfully");
      const app = express();

      app.use((req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
        res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        next();
      });

      app.use(crossOrigin({ origin: "*" }));
      app.use(morgan("dev"));
      app.use(express.static("public"));

      app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(specs, { explorer: true })
      );

      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(authenticateToken);

      const authRouter = require("./routes/auth_route");

      app.use("/auth", authRouter);

      const postsRouter = require("./routes/posts_route");

      app.use("/posts", postsRouter);

      const commentsRouter = require("./routes/comments_route");

      app.use("/comments", commentsRouter);

      const usersRouter = require("./routes/users_route");

      app.use("/users", usersRouter);

      const aiRouter = require("./routes/ai_route");
      app.use("/ai", aiRouter);

      app.use((error, req, res) => {
        console.error(error.stack);
        res.status(500).send("Something broke!");
      });

      resolve(app);
    })
    .catch((error) => reject(error));
});

export default appPromise;
