import * as express from "express";
import {
  login,
  register,
  logout,
  refreshToken,
  googleLogin,
} from "../controllers/auth_controller";
import { authenticateToken } from "../middlewares/auth_middleware";

const router = express.Router();

router.post("/login", login);

router.post("/google-login", googleLogin);

router.post("/logout", authenticateToken, logout);

router.post("/register", register);

router.post("/refresh-token", authenticateToken, refreshToken);

module.exports = router;
