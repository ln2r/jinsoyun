import Redis from "ioredis";

exports.redisClient = new Redis(process.env.REDIS_URL);