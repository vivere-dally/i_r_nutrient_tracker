import React, { useCallback, useContext, useEffect, useReducer, useState } from "react";
import PropTypes from 'prop-types';
import { State } from "../core/state";
import { getLogger, getReducer } from "../core/utils";
import { Meal } from "./meal";
import { useNetworkStatus } from "../core/network-status";
import { AuthenticationContext } from "../authentication/authentication-provider";
import { ActionState, ActionType } from "../core/action";
import { deleteMealById, deleteStoredMealById, getMealById, getMeals, saveMeal, storageSetMeal, updateMeal } from "./meal-storage";
import { EntityState } from "../core/entity";
import { newMealWebSocket, setAuthorizationToken } from "./meal-api";
import { environment } from "../environments/environment";
import { PhotoContext } from "../core/photo-provider";

const log = getLogger('meal/meal-provider');
interface MealState extends State<Meal, number> {
    create?: (meal: Meal) => Promise<any>,
    read?: (mealId: number) => Promise<any>,
    update?: (meal: Meal) => Promise<any>,
    remove?: (mealId: number) => Promise<any>,
    removeFromState?: (mealId: number) => Promise<any>,
    get?: (cancelled: boolean, byComment: string | null, isEaten: boolean | null) => Promise<boolean>
};

const reducer = getReducer<MealState, Meal, number>();
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
    const { data, executing, actionType, actionError } = state;
    const authenticationContext = useContext(AuthenticationContext);
    const photoContext = useContext(PhotoContext);
    const { networkStatus } = useNetworkStatus();
    const [page, setPage] = useState<number>(0);
    // const [key, setKey] = useState<string>('');
    const [queryParameters, setQueryParameters] = useState<string>('');

    // Effects
    useEffect(() => {
        // Get first page
        let cancelled = false;
        getMealsCallback(cancelled, null, null);
        return () => {
            cancelled = true;
        }
    }, [authenticationContext.isAuthenticated]);
    useEffect(wsEffect, [authenticationContext.isAuthenticated, networkStatus]);

    // Callbacks
    const create = useCallback<(meal: Meal) => Promise<any>>(saveMealCallback, []);
    const read = useCallback<(mealId: number) => Promise<any>>(getMealByIdCallback, [photoContext]);
    const update = useCallback<(meal: Meal) => Promise<any>>(updateMealCallback, []);
    const remove = useCallback<(mealId: number) => Promise<any>>(deleteMealCallback, []);
    const removeFromState = useCallback<(mealId: number) => Promise<any>>(deleteMealFromStateCallback, []);
    const get = useCallback<(cancelled: boolean, byComment: string | null, isEaten: boolean | null) => Promise<boolean>>(getMealsCallback, [authenticationContext, photoContext, page, queryParameters]);

    const value = { data, executing, actionType, actionError, create, read, update, remove, removeFromState, get };
    log('MealProvider - return');
    return (
        <MealContext.Provider value={value}>
            {children}
        </MealContext.Provider>
    )

    //#region CRUD

    async function saveMealCallback(meal: Meal) {
        try {
            log('[saveMealCallback] Start.');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.SAVE });
            const _meal: Meal = await saveMeal(meal);
            log('[saveMealCallback] Success.');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.SAVE, data: _meal });
        } catch (error) {
            log('[saveMealCallback] Error.');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.SAVE, data: error });
        }
    }

    async function getMealByIdCallback(mealId: number) {
        try {
            log('[getMealByIdCallback] Start.');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET_ONE });
            const meal: Meal = await getMealById(mealId);
            photoContext.load && await photoContext.load(meal.userId!, meal.id!);
            log('[getMealByIdCallback] Success.');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_ONE, data: meal });
        } catch (error) {
            log('[getMealByIdCallback] Error.');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET_ONE, data: error });
        }
    }

    async function updateMealCallback(meal: Meal) {
        try {
            log('[getMealByIdCallback] Start.');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.UPDATE });
            const _meal: Meal = await updateMeal(meal);
            log('[getMealByIdCallback] Success.');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.UPDATE, data: _meal });
        } catch (error) {
            log('[getMealByIdCallback] Error.');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.UPDATE, data: error });
        }
    }

    async function deleteMealFromStateCallback(mealId: number) {
        try {
            log('[deleteMealFromStateCallback] Start.');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.DELETE });
            log('[deleteMealFromStateCallback] Success.');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.DELETE, data: { id: mealId } });
        } catch (error) {
            log('[deleteMealFromStateCallback] Error.');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.DELETE, data: error });
        }
    }

    async function deleteMealCallback(mealId: number) {
        try {
            log('[deleteMealCallback] Start.');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.DELETE });
            await deleteMealById(mealId);
            log('[deleteMealCallback] Success.');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.DELETE, data: { id: mealId } });
        } catch (error) {
            log('[deleteMealCallback] Error.');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.DELETE, data: error });
        }
    }

    //#endregion

    async function getMealsCallback(cancelled: boolean, byComment: string | null, isEaten: boolean | null) {
        if (!authenticationContext.isAuthenticated) {
            return false;
        }

        setAuthorizationToken(authenticationContext.token, authenticationContext.id!);
        const _key: string = `${byComment}_${isEaten}`;
        let currentPage: number = page;
        if (queryParameters !== _key) {
            setQueryParameters(_key);
            setPage(0);
            currentPage = 0;
        }

        var pageSize = -1;
        try {
            log('[deleteMealCallback] Start.');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET });
            const meals: Meal[] = await getMeals(currentPage, byComment, isEaten);
            meals.forEach(async (meal) => { photoContext.load && await photoContext.load(meal.userId!, meal.id!); });
            log('[deleteMealCallback] Success.');
            pageSize = meals.length;
            if (!cancelled) {
                if (currentPage === 0) {
                    dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: meals });
                } else {
                    dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_PAGED, data: meals });
                }
            }
        } catch (error) {
            log('[deleteMealCallback] Error.');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
        }

        setPage(currentPage + 1);
        return pageSize < environment.pageSize;
    }

    function wsEffect() {
        let cancelled: boolean = !networkStatus.connected;
        log('[wsEffect] Connecting');
        let webSocket = newMealWebSocket(payload => {
            if (cancelled) {
                return;
            }

            if (payload.data.userId === authenticationContext.id) {
                log(`[wsEffect] Received ${payload.data.entity.id}`);
                const meal: Meal = { ...payload.data.entity, entityState: EntityState.UNCHANGED };
                if (payload.actionType) {
                    switch (payload.actionType) {
                        case ActionType.SAVE:
                        case ActionType.UPDATE:
                            log(`[wsEffect] setMeal ${meal.id}`);
                            storageSetMeal(meal);
                            break;

                        case ActionType.DELETE:
                            if (meal.id) {
                                log(`[wsEffect] setMeal ${meal.id}`);
                                deleteStoredMealById(meal.id);
                            }

                            break;

                        default:
                            log('[default]')
                    }
                }

                dispatch({ actionType: payload.actionType, actionState: ActionState.SUCCEEDED, data: meal });
            }
        });

        return () => {
            log('[wsEffect] Disconnecting');
            cancelled = true;
            webSocket.close();
        }
    }
}
