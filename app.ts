import { swaggerOptions } from "./swagger/swagger_setup";
import { authenticateToken } from "./middlewares/auth_middleware";

const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config();
const app = express();

const specs = swaggerJsdoc(swaggerOptions);
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

mongoose.connect(process.env.DB_CONNECT);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database successfully"));

const appPromise: Promise<any> = new Promise((resolve, reject) => {
  mongoose
    .connect(process.env.DB_CONNECT)
    .then(() => {
      console.log("Connected to database successfully");
      const app = express();
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

app.listen(process.env.PORT, () => {
  console.log(`app listening at http://localhost:${process.env.PORT}`);
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});

      resolve(app);
    })
    .catch((error) => {
      console.error("Failed to connect to database:", error);
      reject(error);
    });
});

export default appPromise;
