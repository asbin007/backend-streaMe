"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://img.youtube.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            frameSrc: [
                "'self'",
                "https://www.youtube.com",
                "https://vidsrc.xyz",
                "https://vidsrc.to",
                "https://vidlink.pro",
                "https://superembed.stream",
                "https://vidbinge.com",
                "https://vidsrcme.ru",
                "https://vidsrcme.su",
                "https://vidsrc-me.ru",
                "https://vidsrc-me.su",
                "https://vidsrc-embed.ru",
                "https://vidsrc-embed.su",
                "https://vsrc.su",
                "https://vidfast.pro",
            ],
            connectSrc: ["'self'", "https://api.themoviedb.org"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, cookie_parser_1.default)());
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const contentRoutes_1 = __importDefault(require("./routes/contentRoutes"));
const tmdbRoutes_1 = __importDefault(require("./routes/tmdbRoutes"));
const stream_route_1 = __importDefault(require("./routes/stream.route"));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/content', contentRoutes_1.default);
app.use('/api/tmdb', tmdbRoutes_1.default);
app.use('/api/v1/stream', stream_route_1.default);
app.get('/', (req, res) => {
    res.send('Server is running');
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.authenticate();
        console.log('Database connected successfully.');
        yield database_1.default.sync({ alter: true });
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});
startServer();
