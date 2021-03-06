import { ActionType, ActionState, ActionPayload } from "./action";
import { Entity } from "./entity";
import { State } from "./state";

export const getLogger: (tag: string) =>
    (...args: any) =>
        void = tag =>
        (...args) =>
            console.log(tag, ...args);

export async function execWithLogs<T>(promise: Promise<T>, caller: string, log: (...args: any) => void): Promise<T> {
    log(`${caller} - START`);
    return promise
        .then(result => {
            log(`${caller} - SUCCESS`);
            return Promise.resolve(result);
        })
        .catch(error => {
            log(`${caller} - FAILURE`);
            return Promise.reject(error);
        });
}

export function getReducer<S extends State<E, T>, E extends Entity<T>, T>(): (state: S, actionPayload: ActionPayload) => S {
    const reducer: (state: S, actionPayload: ActionPayload) => S = (state, { actionState, actionType, data }) => {
        switch (actionState) {
            case ActionState.STARTED:
                return { ...state, executing: true, actionType: actionType, actionError: null };
            case ActionState.SUCCEEDED:
                switch (actionType) {
                    case ActionType.GET:
                        return { ...state, executing: false, data: data }
                    case ActionType.GET_PAGED:
                        return {
                            ...state, executing: false, data: (function (): Entity<T>[] {
                                const stateData = [...(state.data || [])];
                                return stateData.concat(data);
                            }())
                        }
                    case ActionType.GET_ONE:
                        return {
                            ...state, executing: false, data: (function (): Entity<T>[] {
                                const stateData = [...(state.data || [])];
                                const index = stateData.findIndex(it => it.id === data.id);
                                if (index === -1) {
                                    stateData.splice(0, 0, data);
                                }
                                else {
                                    stateData[index] = data;
                                }

                                return stateData;
                            }())
                        }
                    case ActionType.SAVE:
                        return {
                            ...state, executing: false, data: (function (): Entity<T>[] {
                                const stateData = [...(state.data || [])];
                                const index = stateData.findIndex(it => it.id === data.id);
                                if (index === -1) {
                                    stateData.splice(0, 0, data);
                                }

                                return stateData;
                            }())
                        }
                    case ActionType.UPDATE:
                        return {
                            ...state, executing: false, data: (function (): Entity<T>[] {
                                const stateData = [...(state.data || [])];
                                const index = stateData.findIndex(it => it.id === data.id);
                                if (index !== -1) {
                                    stateData[index] = data;
                                }

                                return stateData;
                            }())
                        }
                    case ActionType.DELETE:
                        return {
                            ...state, executing: false, data: (function (): Entity<T>[] {
                                const stateData = [...(state.data || [])];
                                const index = stateData.findIndex(it => it.id === data.id);
                                if (index !== -1) {
                                    stateData.splice(index, 1);
                                }

                                return stateData;
                            }())
                        }
                    default:
                        return state;
                }
            case ActionState.FAILED:
                return { ...state, executing: false, actionError: data };
            default:
                return state;
        }
    }

    return reducer;
}

export function getDateWithOffset(date: string): string {
    var offset = new Date().getTimezoneOffset();
    return new Date(new Date(date).getTime() - offset * 60000).toISOString();
}

export function base64StringToBlob(
    base64Data: string,
    contentType: string,
    sliceSize: number = 512
): Blob {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
};
