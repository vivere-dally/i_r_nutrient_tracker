import { EntityState } from "../core/entity";
import { getLogger } from "../core/utils";
import { Meal } from "./meal";
import { getStoredMeals } from "./meal-storage";

const log = getLogger('meal/meal-sync');

export async function syncMeals(
    create: (meal: Meal) => Promise<any>,
    update: (meal: Meal) => Promise<any>,
    remove: (mealId: number) => Promise<any>,
    removeFromState: (mealId: number) => Promise<any>
) {
    try {
        const meals: Meal[] = await getStoredMeals();
        meals.forEach(async (meal: Meal) => {
            switch (meal.entityState) {
                case EntityState.ADDED:
                    log(`[syncMeals] ADDED ${meal.id}`);
                    await create(meal);
                    if (meal.id) {
                        removeFromState(meal.id);
                    }

                    break;

                case EntityState.DELETED:
                    log(`[syncMeals] DELETED ${meal.id}`);
                    if (meal.id) {
                        remove(meal.id);
                    }

                    break;

                case EntityState.UPDATED:
                    log(`[syncMeals] UPDATED ${meal.id}`);
                    if (!meal.hasConflict) {
                        update(meal);
                    }

                    break;

                case EntityState.UNCHANGED:
                default:
                    log(`[syncMeals] UNCHANGED ${meal.id}`);
            }
        });
    } catch (error) {
        log(`[syncMeals] ERROR\n${JSON.stringify(error)}`);
    }
}
