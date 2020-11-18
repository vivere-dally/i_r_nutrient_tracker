import React, { useCallback, useContext, useEffect, useReducer, useState } from "react";
import PropTypes from 'prop-types';
import { Storage } from "@capacitor/core";
import { State } from "../core/state";
import { getLogger, getReducer } from "../core/utils";
import { Meal } from "./meal";
import { ActionState, ActionType } from "../core/action";
import { deleteMeal, getAllEatenMeals, getMealById, getMeals, getMealsByComment, getMealsPaged, isNetworkError, newMealWebSocket, saveMeal, setAuthorizationToken, storageSetMeal, updateMeal } from "./meal-api";
import { AuthenticationContext } from "../authentication/authentication-provider";
import { environment } from "../environments/environment";

interface MealState extends State<Meal, number> {
    save_?: MealParamToPromise,
    update_?: MealParamToPromise,
    delete_?: NumberParamToPromise,
    get_?: NumberParamToPromise,
    getByComment_?: StringParamToPromise,
    getAllEaten_?: VoidToPromise,
    getPaged_?: BooleanToBooleanPromise,
    setReload_?: BooleanToPromise
}

const log = getLogger('meal/meal-provider');
const reducer = getReducer<MealState, Meal, number>();
export type MealParamToPromise = (meal: Meal) => Promise<any>;
export type NumberParamToPromise = (value: number) => Promise<any>;
export type StringParamToPromise = (value: string) => Promise<any>;
export type VoidToPromise = () => Promise<any>;
export type BooleanToPromise = (value: boolean) => Promise<any>;
export type BooleanToBooleanPromise = (value: boolean) => Promise<boolean>;

const mealInitialState: MealState = {
    executing: false
};

export const MealContext = React.createContext<MealState>(mealInitialState);
interface MealProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const MealProvider: React.FC<MealProviderProps> = ({ children }) => {
    // States
    const [state, dispatch] = useReducer(reducer, mealInitialState);
    const authenticationContext = useContext(AuthenticationContext);
    const { data, executing, actionType, actionError } = state;
    const [page, setPage] = useState<number>(0);
    const [reload, setReload] = useState<boolean>(true);
    let ws: WebSocket;

    // Effects
    useEffect(getFirstPageEffect, [authenticationContext.isAuthenticated, reload]);
    useEffect(wsEffect, [authenticationContext.isAuthenticated]);

    // Callbacks
    const save_ = useCallback<MealParamToPromise>(saveMealCallback, []);
    const update_ = useCallback<MealParamToPromise>(updateMealCallback, []);
    const delete_ = useCallback<NumberParamToPromise>(deleteMealCallback, []);
    const getById_ = useCallback<NumberParamToPromise>(getMealByIdCallback, []);
    const getByComment_ = useCallback<StringParamToPromise>(getByCommentCallback, [authenticationContext]);
    const getAllEaten_ = useCallback<VoidToPromise>(getAllEatenCallback, [authenticationContext]);
    const getPaged_ = useCallback<BooleanToBooleanPromise>(getPagedCallback, [authenticationContext, page]);
    const setReload_ = useCallback<BooleanToPromise>(setReloadCallback, []);

    const value = { data, executing, actionType, actionError, save_, update_, delete_, getById_, getByComment_, getAllEaten_, getPaged_, setReload_ };

    log('MealProvider - return');
    return (
        <MealContext.Provider value={value}>
            {children}
        </MealContext.Provider>
    )

    async function getMealByIdCallback(mealId: number) {
        try {
            log('getMealByIdCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET_ONE });
            const data = await getMealById(mealId);
            log('getMealByIdCallback - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_ONE, data: data });
        }
        catch (error) {
            log('getMealByIdCallback - failure');
            if (await isNetworkError(error)) {
                const result = await Storage.get({ key: String(mealId) });
                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_ONE, data: JSON.parse(result.value) });
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET_ONE, data: error });
        }
    }

    function getFirstPageEffect() {
        let cancelled = false;
        if (reload) {
            getPagedCallback(cancelled);
        }

        return () => {
            cancelled = true;
        }
    }

    async function getPagedCallback(cancelled: boolean): Promise<boolean> {
        if (!authenticationContext.isAuthenticated) {
            return false;
        }

        setAuthorizationToken(authenticationContext.token, authenticationContext.id!);
        var pageSize = -1;
        try {
            log('getMealsEffect - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET });
            const data = await getMealsPaged(page);
            pageSize = data.length;
            log('getMealsEffect - success');
            if (!cancelled) {
                if (page === 0) {
                    dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
                    setReload(false);
                }
                else {
                    dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_PAGED, data: data });
                }
            }
        }
        catch (error) {
            log('getMealsEffect - failure');
            if (await isNetworkError(error)) {
                var index: number = 0;
                const offset: number = page * environment.pageSize;
                const limit: number = offset + environment.pageSize;
                const data: any[] = [];
                await Storage
                    .keys()
                    .then(allKeys => {
                        allKeys.keys.forEach(key => {
                            Storage
                                .get({ key })
                                .then(result => {
                                    try {
                                        const object = JSON.parse(result.value);
                                        if (object.userId === authenticationContext.id) {
                                            if (offset <= index && index < limit) {
                                                data.push(object);
                                            }

                                            index += 1;
                                        }
                                    }
                                    catch { }
                                })
                        });
                    });

                pageSize = data.length;
                if (!cancelled) {
                    if (page === 0) {
                        dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
                        setReload(false);
                    }
                    else {
                        dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_PAGED, data: data });
                    }
                }
            }
            else {
                dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
            }
        }
        finally {
            setPage(page + 1);
            return pageSize < environment.pageSize;
        }
    }

    async function getByCommentCallback(comment: String) {
        if (!authenticationContext.isAuthenticated) {
            return;
        }

        setAuthorizationToken(authenticationContext.token, authenticationContext.id!);
        try {
            log('getByCommentCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET });
            const data = await getMealsByComment(comment);
            log('getByCommentCallback - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
        }
        catch (error) {
            log('getByCommentCallback - failure');
            if (await isNetworkError(error)) {
                const data: any[] = [];
                await Storage
                    .keys()
                    .then(allKeys => {
                        allKeys.keys.forEach(key => {
                            Storage
                                .get({ key })
                                .then(result => {
                                    try {
                                        const object = JSON.parse(result.value);
                                        if (object.userId === authenticationContext.id && object.comment!.startsWith(comment)) {
                                            data.push(object);
                                        }
                                    }
                                    catch { }
                                })
                        });
                    });

                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
        }
    }

    async function getAllEatenCallback() {
        if (!authenticationContext.isAuthenticated) {
            return;
        }

        setAuthorizationToken(authenticationContext.token, authenticationContext.id!);
        try {
            log('getMealsEffect - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET });
            const data = await getAllEatenMeals();
            log('getMealsEffect - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
        }
        catch (error) {
            log('getMealsEffect - failure');
            if (await isNetworkError(error)) {
                const data: any[] = [];
                await Storage
                    .keys()
                    .then(allKeys => {
                        allKeys.keys.forEach(key => {
                            Storage
                                .get({ key })
                                .then(result => {
                                    try {
                                        const object = JSON.parse(result.value);
                                        if (object.userId === authenticationContext.id && object.eaten) {
                                            data.push(object);
                                        }
                                    }
                                    catch { }
                                })
                        });
                    });

                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
        }
    }

    async function saveMealCallback(meal: Meal) {
        try {
            log('saveMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.SAVE });
            await saveMeal(meal);
        }
        catch (error) {
            log('saveMealCallback - failure');
            if (await isNetworkError(error)) {
                meal.id = Math.floor(Math.random() * (1e10));
                await storageSetMeal(meal);
                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.SAVE, data: meal });
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.SAVE, data: error });
        }
    }

    async function updateMealCallback(meal: Meal) {
        try {
            log('updateMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.UPDATE });
            await updateMeal(meal);
        }
        catch (error) {
            log('updateMealCallback - failure');
            if (await isNetworkError(error)) {
                await storageSetMeal(meal);
                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.UPDATE, data: meal });
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.UPDATE, data: error });
        }
    }

    async function deleteMealCallback(mealId: number) {
        try {
            log('deleteMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.DELETE });
            await deleteMeal(mealId);
        }
        catch (error) {
            log('deleteMealCallback - failure');
            if (await isNetworkError(error)) {
                await Storage.remove({ key: String(mealId) });
                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.DELETE, data: { id: mealId } });
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.DELETE, data: error });
        }
    }

    async function setReloadCallback(value: boolean) {
        setPage(0);
        setReload(value);
    }

    function wsEffect() {
        let cancelled = false;
        log('wsEffect - connecting');
        let webSocket = newMealWebSocket(payload => {
            if (cancelled) {
                return;
            }

            if (payload.data.userId === authenticationContext.id) {
                log(`wsEffect - received ${payload.data.entity}`);
                dispatch({ actionType: payload.actionType, actionState: ActionState.SUCCEEDED, data: payload.data.entity });
            }
        });

        ws = webSocket;
        return () => {
            log('wsEffect - disconnectiong');
            cancelled = true;
            webSocket.close();
        }
    }
}

