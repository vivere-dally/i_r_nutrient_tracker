import { Entity } from "./entity";

export interface Meal extends Entity {
    comment: string;
    mealDate: string;
    foodIds: number[];
};
