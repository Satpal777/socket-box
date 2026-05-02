import { Redis } from "ioredis";

export function createRedisConnection() {
    const redisClient = new Redis(process.env.REDIS_URL!);

    redisClient.on("connect", () => {
        console.log("Connected to Redis");
    });

    redisClient.on("error", (error) => {
        console.log("Failed to connect to Redis", error);
    });

    return redisClient;
}

export const redisClient = createRedisConnection();
export const pub = redisClient.duplicate();
export const sub = redisClient.duplicate();

export const CHANNELS = {
    usersOnline: "users:online",
    checkboxUpdated: "checkbox:updated",
} as const;
