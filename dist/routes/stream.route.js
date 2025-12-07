"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stream_controller_1 = require("../controllers/stream.controller");
const router = express_1.default.Router();
router.get("/:mediaType/:id", stream_controller_1.getStreamingUrl);
exports.default = router;
