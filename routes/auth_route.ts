import * as express from "express";
import { login, register, logout } from "../controllers/auth_controller";

const router = express.Router();

router.post("/login", login);

router.post("/logout", logout);

router.post("/register", register);

module.exports = router;