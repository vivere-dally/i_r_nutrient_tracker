import { Entity } from "../domain/model/entity";
import { actionBuilder, ActionState, ApiAction, getLogger } from "./utils";

export interface State<T extends Entity> {
    data?: T[];
    executing: boolean;
    apiAction?: ApiAction;
    apiActionError?: Error | null;
}

export interface ActionProps {
    type: string;
    payload?: any;
}

export function getReducer<T extends State<E>, E extends Entity>(caller: string, modelType: string): (state: T, action: ActionProps) => T {
    const log = getLogger(caller);
    const buildAction = actionBuilder(modelType);
    const reducer: (state: T, action: ActionProps) => T = (state, { type, payload }) => {
        log(type);
        switch (type) {
            // GET
            case buildAction(ApiAction.GET, ActionState.STARTED):
                return { ...state, executing: true, apiAction: ApiAction.GET, apiActionError: null };
            case buildAction(ApiAction.GET, ActionState.SUCCEEDED):
                return { ...state, executing: false, data: payload.data };
            case buildAction(ApiAction.GET, ActionState.FAILED):
                return { ...state, executing: false, apiActionError: payload };

            // SAVE
            case buildAction(ApiAction.SAVE, ActionState.STARTED):
                return { ...state, executing: true, apiAction: ApiAction.SAVE, apiActionError: null };
            case buildAction(ApiAction.SAVE, ActionState.SUCCEEDED):
                return {
                    ...state, executing: false, data: (function (): Entity[] {
                        const data = [...(state.data || [])];
                        const entity = payload.data;
                        const index = data.findIndex(it => it.id === entity.id);
                        if (index === -1) {
                            data.splice(0, 0, entity);
                        }

                        return data;
                    })()
                };
            case buildAction(ApiAction.SAVE, ActionState.FAILED):
                return { ...state, executing: false, apiActionError: payload };

            // UPDATE
            case buildAction(ApiAction.UPDATE, ActionState.STARTED):
                return { ...state, executing: true, apiAction: ApiAction.UPDATE, apiActionError: null };
            case buildAction(ApiAction.UPDATE, ActionState.SUCCEEDED):
                return {
                    ...state, executing: false, data: (function (): Entity[] {
                        const data = [...(state.data || [])];
                        const entity = payload.data;
                        const index = data.findIndex(it => it.id === entity.id);
                        if (index !== -1) {
                            data[index] = entity;
                        }

                        return data;
                    })()
                };
            case buildAction(ApiAction.UPDATE, ActionState.FAILED):
                return { ...state, executing: false, apiActionError: payload };

            // DELETE
            case buildAction(ApiAction.DELETE, ActionState.STARTED):
                return { ...state, executing: true, apiAction: ApiAction.DELETE, apiActionError: null };
            case buildAction(ApiAction.DELETE, ActionState.SUCCEEDED):
                return {
                    ...state, executing: false, data: (function (): Entity[] {
                        const data = [...(state.data || [])];
                        const entity = payload.data;
                        const index = data.findIndex(it => it.id === entity.id);
                        if (index !== -1) {
                            data.splice(index, 1);
                        }

                        return data;
                    })()
                }
            case buildAction(ApiAction.DELETE, ActionState.FAILED):
                return { ...state, executing: false, apiActionError: payload };

            // DEFAULT
            default:
                log('default');
                return state;
        }
    }

    return reducer;
}
