import * as express from "express";
import { getCurrentUser, updateUser } from "../controllers/users_controller";

const router = express.Router();

router.get("/me", getCurrentUser);

router.put("/:userId", updateUser);

module.exports = router;
