import * as fs from "fs";
import { User } from "../dtos/user";
import { Request, Response } from "express";
import { deleteFile, uploadFile } from "../utils/multer";
import { UserModel } from "../models/user_model";
import { createNewUser, findUserById } from "../services/user_service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users: User[] = await UserModel.find();
    res.send(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getUserById = async (req: Request, res: Response) => {
  const userId: string = req.params.userId;

  try {
    const user: User = await findUserById(userId);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send("Cannot find specified user");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createUser = async (req: Request, res: Response) => {
  const createdUser: User = req.body;
  try {
    const user: User = await createNewUser(createdUser);
    res.status(201).send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res);
    const username: string = req.body.username;

    const userId: string = req.params.userId;
    const updatedUserData: Partial<User> = {
      username,
      ...(req.file && req.file.filename && { photo: req.file.filename }),
    };

    const existingUser = await UserModel.findOne({
      username: updatedUserData.username,
    });

    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).send("Username already exists");
    }

    const currentUserPhoto = (await UserModel.findById(userId)).photo;

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      updatedUserData,
      { new: true }
    );

    if (updatedUser) {
      currentUserPhoto && deleteFile(currentUserPhoto);
      res.status(201).send(updatedUser);
    } else {
      req.file?.filename && deleteFile(req.file.filename);
      res.status(404).send("Cannot find specified user");
    }
  } catch (error) {
    req.file?.filename && deleteFile(req.file.filename);
    res.status(500).send(error.message);
  }
};

const deleteUserById = async (req: Request, res: Response) => {
  const userId: string = req.params.userId;

  try {
    const result = await UserModel.deleteOne({ _id: userId });
    if (result.deletedCount > 0) {
      res.status(201).send();
    } else {
      res.status(404).send("Cannot find specified user");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getCurrentUser = async (req: Request & { user: User }, res: Response) => {
  try {
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserById,
  getCurrentUser,
};
