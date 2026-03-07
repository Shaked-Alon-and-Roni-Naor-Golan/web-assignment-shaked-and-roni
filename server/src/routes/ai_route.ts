import * as express from "express";

import { enhanceReview } from "../controllers/ai_controller";

const router = express.Router();

router.post("/enhance", enhanceReview);

module.exports = router;
