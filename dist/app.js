const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
dotenv.config();
const app = express();
mongoose.connect(process.env.DB_CONNECT);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database successfully"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const postsRouter = require("./routes/posts_route");
const commentsRouter = require("./routes/comments_route");
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.listen(process.env.PORT, () => {
    console.log(`app listening at http://localhost:${process.env.PORT}`);
    console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
//# sourceMappingURL=app.js.map