import { EntityState } from "../core/entity";
import { getLogger } from "../core/utils";
import { Meal } from "./meal";
import { MealParamToPromise, NumberParamToPromise } from "./meal-provider";
import { getStorageAllMeals, storageRemoveMeal } from "./meal-storage";

const log = getLogger('meal/meal-sync');

export async function syncMeals(
    saveMealCallback: MealParamToPromise,
    deleteMealCallback: NumberParamToPromise,
    updateMealCallback: MealParamToPromise,
    getMealbyIdCallback: NumberParamToPromise
) {
    try {
        const meals: Meal[] = await getStorageAllMeals();
        meals.forEach(async (meal: Meal) => {
            switch (meal.entityState) {
                case EntityState.ADDED:
                    log(`${meal.id} - ADDED`);
                    saveMealCallback(meal);
                    break;

                case EntityState.DELETED:
                    log(`${meal.id} - DELETED`);
                    if (meal.id) {
                        deleteMealCallback(meal.id);
                        storageRemoveMeal(meal.id);
                    }

                    break;

                case EntityState.UPDATED:
                    log('TODO');
                    updateMealCallback(meal);
                    break;

                case EntityState.UNCHANGED:
                default:
                    log('DEFAULT');
            }
        });
    }
    catch (err) {
        log(JSON.stringify(err));
    }
}
