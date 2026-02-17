import * as express from "express";
import {
  login,
  register,
  logout,
  refreshToken,
  googleLogin,
} from "../controllers/auth_controller";

const router = express.Router();

router.post("/login", login);

router.post("/google-login", googleLogin);

router.post("/logout", logout);

router.post("/register", register);

router.post("/refresh-token", refreshToken);

module.exports = router;
