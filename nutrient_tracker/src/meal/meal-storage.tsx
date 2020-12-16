import { EntityState } from "../core/entity";
import { Meal } from "./meal";
import { Plugins } from "@capacitor/core";
import { getLogger } from "../core/utils";
import { deleteMealByIdApi, getMealByIdApi, getMealsApi, MealBatch, saveMealApi, updateMealApi } from "./meal-api";
import { environment } from "../environments/environment";

const { Storage } = Plugins;
const log = getLogger('meal/meal-storage');

function __key(id: number | undefined, conflict: boolean): string {
    if (conflict) {
        return `conflict_meal_${id}`;
    }

    return `meal_${id}`;
}

export async function storageSetMeal(meal: Meal, conflict: boolean = false) {
    await Storage.set({
        key: __key(meal.id, conflict),
        value: JSON.stringify(meal)
    });
}

//#region CRUD

export async function saveMeal(meal: Meal): Promise<Meal> {
    meal.entityState = EntityState.ADDED;
    try {
        const apiMeal: Meal = await saveMealApi(meal);
        const _apiMeal: Meal | void = await getMealByIdApi(apiMeal.id!, null);
        if (_apiMeal) { // With ETag
            _apiMeal.entityState = EntityState.UNCHANGED;
            await storageSetMeal(_apiMeal);
            return _apiMeal;
        } else { // Without ETag
            apiMeal.entityState = EntityState.UNCHANGED;
            await storageSetMeal(apiMeal);
            return apiMeal;
        }
    } catch (error) {
        log(`[saveMeal]: ERROR ${JSON.stringify(error)}.`);
        storageSetMeal(meal);
        return meal;
    }
}

export async function getStoredMealById(mealId: number, conflict: boolean = false): Promise<Meal | void> {
    const result = await Storage
        .get({ key: __key(mealId, conflict) })
        .then(result => result.value)
        .catch(() => null);

    if (result) {
        log(`[getMealById] return meal with id ${mealId}`);
        return JSON.parse(result);
    }
}

export async function getMealById(mealId: number): Promise<Meal> {
    const storedMeal: Meal | void = await getStoredMealById(mealId);
    let etag = null;
    if (storedMeal && storedMeal.etag) {
        etag = storedMeal.etag;
    }

    try {
        const apiMeal: Meal | void = await getMealByIdApi(mealId, etag);
        if (apiMeal) {
            apiMeal.entityState = EntityState.UNCHANGED;
            await storageSetMeal(apiMeal);
            return apiMeal;
        }
    } catch (error) {
        log(`[getMealById]: ERROR ${JSON.stringify(error)}.`);
    }

    return storedMeal as Meal; // Cannot be void at this point...
}

export async function updateMeal(meal: Meal): Promise<Meal> {
    meal.entityState = EntityState.UPDATED;
    try {
        const apiMeal: Meal = await updateMealApi(meal); // Updates meal.hasConflict if 412
        apiMeal.etag = (await getMealById(meal.id!)).etag;
        apiMeal.entityState = EntityState.UNCHANGED;
        if (meal.hasConflict) {
            meal.etag = apiMeal.etag;
            await storageSetMeal(meal); // Set hasConflict & new etag
            await storageSetMeal(apiMeal, true); // Set conflicted meal
            return meal;
        } else {
            deleteStoredMealById(meal.id!, true); // Delete conflict if any
        }

        await storageSetMeal(apiMeal);
        return apiMeal;
    } catch (error) {
        log(`[deleteMealById]: ERROR ${JSON.stringify(error)}.`);
        await storageSetMeal(meal);
        return meal;
    }
}

export async function deleteStoredMealById(mealId: number, conflict: boolean = false): Promise<Meal | void> {
    const storedMeal: Meal | void = await getStoredMealById(mealId, conflict);
    await Storage.remove({ key: __key(mealId, conflict) });
    return storedMeal;
}

export async function deleteMealById(mealId: number): Promise<Meal | void> {
    try {
        const meal: Meal = await deleteMealByIdApi(mealId);
        await deleteStoredMealById(mealId);
        return meal;
    } catch (error) {
        log(`[deleteMealById]: ERROR ${JSON.stringify(error)}.`);
    }

    const meal: Meal | void = await getStoredMealById(mealId);
    if (meal) {
        meal.entityState = EntityState.DELETED;
        await storageSetMeal(meal);
    }
}

//#endregion

export async function getStoredMeals(): Promise<Meal[]> {
    const meals: Meal[] = [];
    await Storage
        .keys()
        .then(allKeys => {
            allKeys
                .keys
                .forEach(key => {
                    if (key.indexOf('meal_') >= 0) {
                        Storage
                            .get({ key })
                            .then(result => {
                                try {
                                    if (result.value) {
                                        const meal: Meal = JSON.parse(result.value);
                                        meals.push(meal);
                                    }
                                } catch { }
                            })
                    }
                });
        });

    return meals;
}

export async function getMeals(page: number, byComment: string | null, isEaten: boolean | null): Promise<Meal[]> {
    const key: string = `meals_${page}_${byComment}_${isEaten}`;
    const value: string | null = await Storage.get({ key: key }).then(result => result.value);
    let etag: string | null = null;
    let mealStoredBatch: MealBatch | null = null;
    if (value) {
        mealStoredBatch = JSON.parse(value);
        if (mealStoredBatch?.etag) {
            etag = mealStoredBatch.etag;
        }
    }

    // Get from API & Store
    try {
        const mealBatch: MealBatch | void = await getMealsApi(page, byComment, isEaten, etag);
        if (mealBatch) {
            const meals: Meal[] = [];
            for (let index = 0; index < mealBatch.meals.length; index++) {
                const mealWithEtag: Meal = await getMealById(mealBatch.meals[index].id!);
                meals.push(mealWithEtag);
            }

            mealBatch.meals = meals;
            await Storage.set({
                key: key,
                value: JSON.stringify(mealBatch)
            });

            return mealBatch.meals;
        }
    } catch (error) {
        log(`[getMeals]: ERROR ${JSON.stringify(error)}.`);
    }

    // API Call failed. Return stored if possible
    if (mealStoredBatch && mealStoredBatch.meals) {
        return mealStoredBatch.meals;
    }

    // Collect the available results
    var index: number = 0;
    const offset: number = page * environment.pageSize;
    const limit: number = offset + environment.pageSize;
    const meals: Meal[] = [];
    (await getStoredMeals())
        .sort((a, b) => {
            if (a.dateEpoch && b.dateEpoch) {
                return b.dateEpoch - a.dateEpoch;
            }

            return 1;
        })
        .forEach(meal => {
            if (offset <= index && index < limit) {
                if (byComment === null && isEaten === null) {
                    meals.push(meal);
                } else if (byComment && meal.comment?.startsWith(byComment) && isEaten === null) {
                    meals.push(meal);
                } else if (byComment === null && isEaten && meal.eaten === isEaten) {
                    meals.push(meal);
                } else if (byComment && meal.comment?.startsWith(byComment) && isEaten && meal.eaten === isEaten) {
                    meals.push(meal);
                }

                index += 1;
            }
        });

    return meals;
}
