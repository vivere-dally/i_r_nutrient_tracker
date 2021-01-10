import { Entity } from "../core/entity";

export interface Meal extends Entity<number> {
    comment?: string;
    date?: string;
    dateEpoch?: number;
    foods?: string;
    eaten?: boolean;
    price?: number;
    latitude?: number;
    longitude?: number;
    userId?: number;
};

export function compareMeal(a: Meal, b: Meal) {
    if (
        a.id === b.id &&
        a.entityState === b.entityState &&
        a.etag === b.etag &&
        a.comment === b.comment &&
        a.date === b.date &&
        a.dateEpoch === b.dateEpoch &&
        a.foods === b.foods &&
        a.eaten === b.eaten &&
        a.price === b.price &&
        a.latitude == b.latitude &&
        a.longitude == b.longitude &&
        a.userId === b.userId
    ) {
        return true;
    }

    return false;
}
