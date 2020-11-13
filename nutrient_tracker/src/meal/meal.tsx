import { Entity } from "../core/entity";

export interface Meal extends Entity<number> {
    comment?: string;
    date?: string;
    dateEpoch?: number;
    foods?: string;
    eaten?: boolean;
    price?: number;
};
