import { Entity } from "../core/entity";

export interface Credentials extends Entity<number> {
    username?: string;
    password?: string;
}
