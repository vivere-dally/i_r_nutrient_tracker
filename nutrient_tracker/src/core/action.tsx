export enum ActionState {
    STARTED = "STARTED",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED"
};

export enum ActionType {
    GET_ONE = "GET_ONE",
    GET = "GET",
    SAVE = "SAVE",
    UPDATE = "UPDATE",
    DELETE = "DELETE"
};

export interface ActionPayload {
    actionState?: ActionState;
    actionType?: ActionType;
    data?: any;
};
