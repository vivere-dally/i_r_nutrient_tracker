export const getLogger: (tag: string) => (...args: any) => void = tag => (...args) => console.log(tag, ...args);

export async function execWithLogs<T>(promise: Promise<T>, caller: string, log: (...args: any) => void): Promise<T> {
    log(`${caller} - start`);
    try {
        const result = await promise;
        log(`${caller} - success`);
        return Promise.resolve(result);
    } catch (error) {
        log(`${caller} - failure`);
        return Promise.reject(error);
    }
}

export enum ApiAction {
    GET_ONE = "GET_ONE",
    GET = "GET",
    SAVE = "SAVE",
    UPDATE = "UPDATE",
    DELETE = "DELETE"
};

export enum ActionState {
    STARTED = "STARTED",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED"
};

export const actionBuilder: (modelType: string) => (apiAction: ApiAction, actionState: ActionState) => string = modelType => (apiAction, actionState) => { return `${apiAction.toString()}_${modelType}_${actionState.toString()}`; }

export interface ActionProps {
    type: string;
    payload?: any;
}

export interface State<T> {
    data?: T[];
    executing: boolean;
    apiAction: ApiAction;
    apiActionError?: Error | null;
}

export function newReducer<T extends State<E>, E>(caller: string, modelType: string): any {
    const reducer: (state: T, action: ActionProps) => T = (state, { type, payload }) => {
        const log = getLogger(caller);
        const buildAction = actionBuilder(modelType);
        switch (type) {
            // GET
            case buildAction(ApiAction.GET, ActionState.STARTED):
                log(type);
                return { ...state, executing: true, apiAction: ApiAction.GET, apiActionError: null };
            case buildAction(ApiAction.GET, ActionState.SUCCEEDED):
                log(type);
                return { ...state, executing: false, data: payload.data };
            case buildAction(ApiAction.GET, ActionState.FAILED):
                log(type);
                return { ...state, executing: false, apiActionError: payload.error };

            // SAVE
            case buildAction(ApiAction.SAVE, ActionState.STARTED):
                log(type);
                return { ...state, executing: true, apiAction: ApiAction.SAVE, apiActionError: null };
            case buildAction(ApiAction.SAVE, ActionState.SUCCEEDED):
                // TODO
                log(type);
                const data = [...(state.data || [])];
                return { ...state, executing: false, data: data };
            case buildAction(ApiAction.SAVE, ActionState.FAILED):
                log(type);
                return { ...state, executing: false, apiActionError: payload.error };

            // DEFAULT
            default:
                log('default');
                return state;
        }
    }

    return reducer;
}
