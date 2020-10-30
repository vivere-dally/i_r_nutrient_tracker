import { Entity } from "./entity";

export interface Nutrient extends Entity {
    name: string;
    value: number;
};
