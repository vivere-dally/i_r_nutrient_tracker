import { ActionType } from "./action";
import { Entity } from "./entity";

export interface State<E extends Entity<T>, T> {
    data?: E[];
    executing: boolean;
    actionType?: ActionType;
    actionError?: Error | null;
}
