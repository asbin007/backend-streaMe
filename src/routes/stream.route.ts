import express from "express";
import { getStreamingUrl } from "../controllers/stream.controller";

const router = express.Router();

router.get("/:mediaType/:id", getStreamingUrl);

export default router;
