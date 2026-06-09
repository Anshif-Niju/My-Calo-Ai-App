import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { cacheMealPlan, generateDailyMealPlan } from "../../modules/nutrition/nutrition.service";
import { logger } from "../../utils/logger";

export const mealPlanWorker = new Worker(
  "meal-plan",
  async (job) => {
    const { userId, date, userProfile } = job.data;
    logger.info(`🍽️ Generating meal plan [${job.id}] for user ${userId}`);

    const plan = await generateDailyMealPlan(userProfile);
    await cacheMealPlan(userId, date, plan);

    // Also store with job ID for polling
    await redis.set(`mealplan-job:${job.id}`, JSON.stringify(plan), "EX", 300);

    logger.info(`✅ Meal plan generated [${job.id}]`);
    return plan;
  },
  {
    connection: redis as any,
    concurrency: 3, // meal plan generation is heavy
  },
);

mealPlanWorker.on("failed", (job, err) => {
  logger.error(`❌ Meal plan job failed [${job?.id}]: ${err.message}`);
});
