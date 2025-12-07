"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class CacheService {
    constructor(ttlSeconds = 300) {
        this.cache = new node_cache_1.default({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, ttl) {
        if (ttl) {
            return this.cache.set(key, value, ttl);
        }
        return this.cache.set(key, value);
    }
    del(key) {
        return this.cache.del(key);
    }
    flush() {
        this.cache.flushAll();
    }
}
exports.cacheService = new CacheService();
