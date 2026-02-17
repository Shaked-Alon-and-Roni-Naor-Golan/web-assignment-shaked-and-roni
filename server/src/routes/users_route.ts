import * as express from "express";
import { getMe, updateUser } from "../controllers/users_controller";

const router = express.Router();

router.get("/me", getMe);

router.put("/:userId", updateUser);

module.exports = router;
