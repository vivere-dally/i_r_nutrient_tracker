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
