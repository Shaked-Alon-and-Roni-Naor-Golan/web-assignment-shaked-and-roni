"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const postSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
    },
    sender: {
        type: mongoose_1.default.Schema.Types.ObjectId, // TODO: change to User type when User model is created - add ref to "users"
        required: true,
    },
    content: String,
});
exports.PostModel = mongoose_1.default.model("posts", postSchema);
//# sourceMappingURL=posts_model.js.map