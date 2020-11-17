import React, { useCallback, useContext, useEffect, useReducer } from "react";
import PropTypes from 'prop-types';
import { Storage } from "@capacitor/core";
import { State } from "../core/state";
import { getLogger, getReducer } from "../core/utils";
import { Meal } from "./meal";
import { ActionState, ActionType } from "../core/action";
import { deleteMeal, getAllEatenMeals, getMealById, getMeals, getMealsByComment, isNetworkError, newMealWebSocket, saveMeal, setAuthorizationToken, storageSetMeal, updateMeal } from "./meal-api";
import { AuthenticationContext } from "../authentication/authentication-provider";

interface MealState extends State<Meal, number> {
    save_?: MealParamToPromise,
    update_?: MealParamToPromise,
    delete_?: MealIdParamToPromise,
    get_?: MealIdParamToPromise,
    getAll_?: BooleanToPromise,
    getByComment_?: MealCommentToPromise,
    getAllEaten_?: MealEatenToPromise
}

const log = getLogger('meal/meal-provider');
const reducer = getReducer<MealState, Meal, number>();
export type MealParamToPromise = (meal: Meal) => Promise<any>;
export type MealIdParamToPromise = (mealId: number) => Promise<any>;
export type MealCommentToPromise = (comment: string) => Promise<any>;
export type MealEatenToPromise = () => Promise<any>;
export type BooleanToPromise = (cancelled: boolean) => Promise<any>;

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
    let ws: WebSocket;

    // Effects
    useEffect(getMealsEffect, [authenticationContext.isAuthenticated]);
    useEffect(wsEffect, [authenticationContext.isAuthenticated]);

    // Callbacks
    const save_ = useCallback<MealParamToPromise>(saveMealCallback, []);
    const update_ = useCallback<MealParamToPromise>(updateMealCallback, []);
    const delete_ = useCallback<MealIdParamToPromise>(deleteMealCallback, []);
    const getById_ = useCallback<MealIdParamToPromise>(getMealByIdCallback, []);
    const getAll_ = useCallback<BooleanToPromise>(getMealsFromApi, [authenticationContext]);
    const getByComment_ = useCallback<MealCommentToPromise>(getByCommentCallback, [authenticationContext]);
    const getAllEaten_ = useCallback<MealEatenToPromise>(getAllEatenCallback, [authenticationContext]);

    const value = { data, executing, actionType, actionError, save_, update_, delete_, getById_, getAll_, getByComment_, getAllEaten_ };

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

    function getMealsEffect() {
        let cancelled = false;
        getMealsFromApi(cancelled);
        return () => {
            cancelled = true;
        }
    }

    async function getMealsFromApi(cancelled: boolean) {
        if (!authenticationContext.isAuthenticated) {
            return;
        }

        setAuthorizationToken(authenticationContext.token, authenticationContext.id!);
        try {
            log('getMealsEffect - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET });
            const data = await getMeals();
            log('getMealsEffect - success');
            if (!cancelled) {
                dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
            }
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
                                        if (object.userId === authenticationContext.id) {
                                            data.push(object);
                                        }
                                    }
                                    catch { }
                                })
                        });
                    });

                if (!cancelled) {
                    dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: data });
                }
                return;
            }

            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
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

