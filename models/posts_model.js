const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  content: String,
});

module.exports = mongoose.model("posts", postSchema);
