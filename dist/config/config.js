"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    port: process.env.PORT || 5000,
    api_key: process.env.API_KEY,
    api_access_token: process.env.API_ACCESS_TOKEN,
    database_url: process.env.DATABASE_URL,
    wt_secret_key: process.env.WT_SECRET_KEY,
    jwt_expire_in: process.env.JWT_EXPIRE_IN,
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    resend_api_key: process.env.RESEND_API_KEY,
    resend_from: process.env.RESEND_FROM,
};
