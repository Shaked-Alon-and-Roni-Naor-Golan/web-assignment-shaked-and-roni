import * as express from "express";
import {
  getUserById,
  getAllUsers,
  deleteUserById,
  createUser,
  updateUser,
} from "../controllers/users_controller";

const router = express.Router();

router.get("/", getAllUsers);

router.get("/:userId", getUserById);

router.post("/", createUser);

router.put("/:userId", updateUser);

router.delete("/:userId", deleteUserById);

module.exports = router;
