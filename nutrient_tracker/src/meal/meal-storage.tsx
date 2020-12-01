import { EntityState } from "../core/entity";
import { Meal } from "./meal";
import { Plugins } from "@capacitor/core";
import { environment } from "../environments/environment";

const { Storage } = Plugins;

function getMealKey(mealId: number | undefined): string {
    return `meal_${mealId}`;
}

export async function storageSetMeal(meal: Meal) {
    await Storage.set({
        key: getMealKey(meal.id),
        value: JSON.stringify(meal)
    });
}

export async function storageSetConflictMeal(meal: Meal) {
    await Storage.set({
        key: `${getMealKey(meal.id)}_conflict`,
        value: JSON.stringify(meal)
    });
}

export async function storageRemoveMeal(mealId: number) {
    await Storage.remove({ key: getMealKey(mealId) });
}

export function resolveMealResponse(meal: Meal, callback: ((mealId: number) => Promise<void>) | undefined = undefined): Meal {
    const _meal: Meal = { ...meal, entityState: EntityState.UNCHANGED };
    (async () => {
        await storageSetMeal(_meal);

        if (_meal.id && callback) {
            await callback(_meal.id);
        }
    })();

    return _meal;
}

export function resolveMealArrayResponse(meals: Meal[], callback: ((mealId: number) => Promise<void>) | undefined = undefined): Meal[] {
    const _meals: Meal[] = meals.map(meal => {
        const _meal: Meal = { ...meal, entityState: EntityState.UNCHANGED };
        (async () => {
            await storageSetMeal(_meal);
            if (callback && _meal.id) {
                await callback(_meal.id);
            }
        })();
        return _meal;
    });

    return _meals;
}

export async function getStorageMealById(mealId: number): Promise<Meal | void> {
    const result = await Storage.get({ key: getMealKey(mealId) }).then(result => result.value);
    if (result) {
        const meal: Meal = JSON.parse(result);
        return meal;
    }
}

export async function getStorageMealConflictById(mealId: number): Promise<Meal | void> {
    const result = await Storage.get({ key: `${getMealKey(mealId)}_conflict` }).then(result => result.value);
    if (result) {
        const meal: Meal = JSON.parse(result);
        return meal;
    }
}

export async function getStorageMealsPaged(page: number): Promise<Meal[]> {
    var index: number = 0;
    const offset: number = page * environment.pageSize;
    const limit: number = offset + environment.pageSize;
    const meals: Meal[] = [];
    await Storage
        .keys()
        .then(allKeys => {
            allKeys.keys.forEach(key => {
                if (key.indexOf('meal_') >= 0) {
                    Storage
                        .get({ key })
                        .then(result => {
                            try {
                                if (result.value) {
                                    const object = JSON.parse(result.value);
                                    if (offset <= index && index < limit) {
                                        meals.push(object);
                                        index += 1;
                                    }
                                }
                            }
                            catch { }
                        })
                }
            });
        });

    return meals;
}

export async function getStorageMealsByComment(comment: string): Promise<Meal[]> {
    const meals: Meal[] = [];
    await Storage
        .keys()
        .then(allKeys => {
            allKeys.keys.forEach(key => {
                if (key.indexOf('meal_') >= 0) {
                    Storage
                        .get({ key })
                        .then(result => {
                            try {
                                if (result.value) {
                                    const object = JSON.parse(result.value);
                                    if (object.comment!.startsWith(comment)) {
                                        meals.push(object);
                                    }
                                }
                            }
                            catch { }
                        })
                }
            });
        });

    return meals;
}

export async function getStorageAllEatenMeals(): Promise<Meal[]> {
    const meals: Meal[] = [];
    await Storage
        .keys()
        .then(allKeys => {
            allKeys.keys.forEach(key => {
                if (key.indexOf('meal_') >= 0) {
                    Storage
                        .get({ key })
                        .then(result => {
                            try {
                                if (result.value) {
                                    const object = JSON.parse(result.value);
                                    if (object.eaten) {
                                        meals.push(object);
                                    }
                                }
                            }
                            catch { }
                        })
                }
            });
        });

    return meals;
}

export async function getStorageAllMeals(): Promise<Meal[]> {
    const meals: Meal[] = [];
    await Storage
        .keys()
        .then(allKeys => {
            allKeys.keys.forEach(key => {
                if (key.indexOf('meal_') >= 0) {
                    Storage
                        .get({ key })
                        .then(result => {
                            try {
                                if (result.value) {
                                    const object = JSON.parse(result.value);
                                    meals.push(object);
                                }
                            }
                            catch { }
                        })
                }
            });
        });

    return meals;
}
