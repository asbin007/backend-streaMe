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
    mailgun_api_key: process.env.MAILGUN_API_KEY,
    mailgun_domain: process.env.MAILGUN_DOMAIN,
    mailgun_username: process.env.MAILGUN_USERNAME,
    google_client_id: process.env.CLIENT_ID,
    google_client_secret: process.env.CLIENT_SECRET_KEY,
    base_url: process.env.BASE_URL || 'http://localhost:5000',
}
