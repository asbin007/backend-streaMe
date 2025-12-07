import dotenv from 'dotenv';
dotenv.config();

export default {
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
}
