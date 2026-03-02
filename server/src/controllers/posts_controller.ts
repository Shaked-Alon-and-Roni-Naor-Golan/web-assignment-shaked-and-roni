import { Post } from "../dtos/post";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { deleteFile, uploadFile } from "../utils/multer";
import { PostModel } from "../models/posts_model";

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const postOwner: string = String(req.query.postOwner ?? "");
    const offset: number = Number(req.query.offset ?? "0");
    let posts: Post[];

    if (postOwner) {
      posts = await PostModel.find({ owner: postOwner })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(3)
        .populate("owner", "-tokens -email -password")
        .populate("likedBy")
        .populate({ path: "comments", populate: { path: "user" } });
    } else {
      posts = await PostModel.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(3)
        .populate("owner", "-tokens -email -password")
        .populate("likedBy")
        .populate({ path: "comments", populate: { path: "user" } });
    }

    res.send(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getPostById = async (req: Request, res: Response) => {
  const postId: string = req.params.postId;

  try {
    const post: Post = await PostModel.findById(postId)
      .populate("owner", "-tokens -email -password")
      .populate("likedBy")
      .populate({ path: "comments", populate: { path: "user" } });
    if (post) {
      res.send(post);
    } else {
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createPost = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res);
    const post: Post = JSON.parse(req.body.post);
    post.photoSrc = req.file.filename;
    const newPost = await PostModel.create(post);
    
    // Populate the post before sending response
    const populatedPost = await PostModel.findById(newPost._id)
      .populate("owner", "-tokens -email -password")
      .populate("likedBy")
      .populate({ path: "comments", populate: { path: "user" } });

    res.status(201).send(populatedPost);
  } catch (error) {
    req.file?.filename && deleteFile(req.file.filename);
    res.status(500).send(error.message);
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res);
    const postId: string = req.params.postId;

    // Get existing post first
    const existingPost = await PostModel.findById(postId);
    if (!existingPost) {
      if (req.file?.filename) {
        deleteFile(req.file.filename);
      }
      return res.status(404).send("Cannot find specified post");
    }

    let updatedFields: any = {};
    let hasContentChanges = false;
    
    // Parse the request data
    let parsedData: any = {};
    if (req.body.updatedPostContent) {
      parsedData = JSON.parse(req.body.updatedPostContent);
    } else {
      parsedData = req.body;
    }

    // Handle content update
    if (parsedData.content !== undefined) {
      updatedFields.content = parsedData.content;
      hasContentChanges = true;
    }

    // Handle photo update
    if (req.file?.filename) {
      updatedFields.photoSrc = req.file.filename;
      hasContentChanges = true;
    }

    // Handle like toggle via userId
    if (parsedData.userId !== undefined) {
      const userId = parsedData.userId;
      
      // Filter out null/undefined values and convert to strings
      const likedByIds = (existingPost.likedBy || [])
        .filter((id: any) => id != null)
        .map((id: any) => id.toString());
      
      const isLiked = likedByIds.includes(userId);
      
      if (isLiked) {
        // Remove the like - use $pull for atomic operation
        const result = await PostModel.findByIdAndUpdate(
          postId,
          { $pull: { likedBy: new mongoose.Types.ObjectId(userId) } },
          { new: true }
        )
          .populate("owner", "-tokens -email -password")
          .populate("likedBy", "-tokens -email -password")
          .populate({ path: "comments", populate: { path: "user" } });
        
        return res.status(200).send(result);
      } else {
        // Add the like - use $addToSet for atomic operation
        const result = await PostModel.findByIdAndUpdate(
          postId,
          { $addToSet: { likedBy: new mongoose.Types.ObjectId(userId) } },
          { new: true }
        )
          .populate("owner", "-tokens -email -password")
          .populate("likedBy", "-tokens -email -password")
          .populate({ path: "comments", populate: { path: "user" } });
        
        return res.status(200).send(result);
      }
    }

    // Only owner can edit content and photo (NOT for likes)
    if (hasContentChanges && existingPost.owner.toString() !== (req as any).user._id) {
      if (req.file?.filename) {
        deleteFile(req.file.filename);
      }
      return res.status(403).send("You are not the owner of this post");
    }

    let oldPhoto: string;

    if (req.file?.filename && oldPhoto !== req.file.filename) {
      oldPhoto = existingPost.photoSrc;
    }

    // Update the post with $set to ensure proper saving
    const newPost = await PostModel.findByIdAndUpdate(
      postId,
      { $set: updatedFields },
      { new: true }
    )
      .populate("owner", "-tokens -email -password")
      .populate("likedBy", "-tokens -email -password")
      .populate({ path: "comments", populate: { path: "user" } });

    if (newPost) {
      if (oldPhoto) {
        deleteFile(oldPhoto);
      }
      res.status(200).send(newPost);
    } else {
      if (req.file?.filename) {
        deleteFile(req.file.filename);
      }
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    if (req.file?.filename) {
      deleteFile(req.file.filename);
    }
    res.status(500).send(error.message);
  }
};

const deletePostById = async (req: Request, res: Response) => {
  const postId = req.params.postId;

  try {
    const post = await PostModel.findByIdAndDelete(postId);

    if (post) {
      if (post.photoSrc) {
        deleteFile(post.photoSrc);
      }
      res.status(200).send("The post deleted");
    } else {
      res.status(404).send("Post not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export { getAllPosts, getPostById, createPost, updatePost, deletePostById };