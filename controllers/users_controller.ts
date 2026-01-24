import { Request, Response } from "express";
import { User } from "../dtos/user";
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
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createUser = async (req: Request, res: Response) => {
  const createdUser: User = req.body;
  try {
    const user: User = await createNewUser(createdUser);
    res.send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updateUser = async (req: Request, res: Response) => {
  const userId: string = req.params.userId;
  const updatedUserData: User = req.body;

  try {
    const result = await UserModel.updateOne({ _id: userId }, updatedUserData);
    if (result.modifiedCount > 0) {
      res.status(201).send();
    } else {
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
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
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export { getAllUsers, getUserById, createUser, updateUser, deleteUserById };
