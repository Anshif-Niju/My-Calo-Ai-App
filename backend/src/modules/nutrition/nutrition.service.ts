import { redis } from "../../config/redis";

export const getCachedDailySummary = async (userId: string, date: string) => {
  const cached = await redis.get(`summary:${userId}:${date}`);

  return cached ? JSON.parse(cached) : null;
};

export const cacheDailySummary = async (userId: string, date: string, summary: object) => {
  await redis.set(`summary:${userId}:${date}`, JSON.stringify(summary), "EX", 120);
};

export const invalidateDailySummary = async (userId: string, date: string) => {
  await redis.del(`summary:${userId}:${date}`);
};

export const getCachedMealPlan = async (userId: string, date: string) => {
  const cached = await redis.get(`mealplan:${userId}:${date}`);

  return cached ? JSON.parse(cached) : null;
};

export const cacheMealPlan = async (userId: string, date: string, plan: object) => {
  await redis.set(`mealplan:${userId}:${date}`, JSON.stringify(plan), "EX", 86400);
};
