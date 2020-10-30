import { Entity } from "./entity";

export interface Food extends Entity {
    name: string;
    description?: string;
    image?: string;
    nutrientIds: number[];
};
