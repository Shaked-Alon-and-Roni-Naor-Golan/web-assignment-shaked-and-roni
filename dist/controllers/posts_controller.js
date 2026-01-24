"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePost = exports.createPost = exports.getPostById = exports.getAllPosts = void 0;
const posts_model_1 = require("../models/posts_model");
const getAllPosts = async (req, res) => {
    const postSender = String(req.query.postSender);
    try {
        let posts;
        if (postSender) {
            posts = await posts_model_1.PostModel.find({ sender: postSender }); // TODO: add reference to users when created
        }
        else {
            posts = await posts_model_1.PostModel.find();
        }
        res.send(posts);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
};
exports.getAllPosts = getAllPosts;
const getPostById = async (req, res) => {
    const postId = req.params.postId; // TODO: change the types
    try {
        const post = await posts_model_1.PostModel.findById(postId); // TODO: add reference to users when created
        if (post) {
            res.send(post);
        }
        else {
            res.status(404).send("Cannot find specified post");
        }
    }
    catch (error) {
        res.status(500).send(error.message);
    }
};
exports.getPostById = getPostById;
const createPost = async (req, res) => {
    const createdPost = req.body;
    try {
        const post = await posts_model_1.PostModel.create(createdPost);
        res.send(post);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
};
exports.createPost = createPost;
const updatePost = async (req, res) => {
    const postId = req.params.postId; // TODO: change the types
    const updatedPostContent = req.body;
    try {
        const result = await posts_model_1.PostModel.updateOne({ _id: postId }, updatedPostContent); // TODO: add reference to users when created
        if (result.modifiedCount > 0) {
            res.status(201).send();
        }
        else {
            res.status(404).send("Cannot find specified post");
        }
    }
    catch (error) {
        res.status(500).send(error.message);
    }
};
exports.updatePost = updatePost;
//# sourceMappingURL=posts_controller.js.map