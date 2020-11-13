import React, { useCallback, useEffect, useReducer } from "react";
import PropTypes from 'prop-types';
import { State } from "../core/state";
import { getLogger, getReducer } from "../core/utils";
import { Meal } from "./meal";
import { ActionState, ActionType } from "../core/action";
import { deleteMeal, getMealById, getMeals, newMealWebSocket, saveMeal, updateMeal } from "./meal-api";

interface MealState extends State<Meal, number> {
    save?: MealParamToPromise,
    update?: MealParamToPromise,
    delete?: MealIdParamToPromise,
    get?: MealIdParamToPromise
}

const log = getLogger('meal/meal-provider');
const reducer = getReducer<MealState, Meal, number>();
export type MealParamToPromise = (meal: Meal) => Promise<any>;
export type MealIdParamToPromise = (mealId: number) => Promise<any>;

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
    let ws: WebSocket;

    // Effects
    useEffect(getMealsEffect, []);
    useEffect(wsEffect, []);

    // Callbacks
    const _save = useCallback<MealParamToPromise>(saveMealCallback, []);
    const _update = useCallback<MealParamToPromise>(updateMealCallback, []);
    const _delete = useCallback<MealIdParamToPromise>(deleteMealCallback, []);
    const _getById = useCallback<MealIdParamToPromise>(getMealByIdCallback, []);

    const value = { data, executing, actionType, actionError, _save, _update, _delete, _getById };

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
            const receivedMeal = await getMealById(mealId);
            log('getMealByIdCallback - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET_ONE, data: receivedMeal });
        }
        catch (error) {
            log('getMealByIdCallback - failure');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET_ONE, data: error });
        }
    }

    function getMealsEffect() {
        let cancelled = false;
        getMealsFromApi();
        return () => {
            cancelled = true;
        }

        async function getMealsFromApi() {
            try {
                log('getMealsEffect - start');
                dispatch({ actionState: ActionState.STARTED, actionType: ActionType.GET });
                const meals = await getMeals();
                log('getMealsEffect - success');
                if (!cancelled) {
                    dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.GET, data: meals });
                }
            }
            catch (error) {
                log('getMealsEffect - failure');
                dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
            }
        }
    }

    async function saveMealCallback(meal: Meal) {
        try {
            log('saveMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.SAVE });
            const savedMeal = await saveMeal(meal);
            log('saveMealCallback - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.SAVE, data: savedMeal });
        }
        catch (error) {
            log('saveMealCallback - failure');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.SAVE, data: error });
        }
    }

    async function updateMealCallback(meal: Meal) {
        try {
            log('updateMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.UPDATE });
            const updatedMeal = await updateMeal(meal);
            log('updateMealCallback - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.UPDATE, data: updatedMeal });
        }
        catch (error) {
            log('updateMealCallback - failure');
            dispatch({ actionState: ActionState.FAILED, actionType: ActionType.UPDATE, data: error });
        }
    }

    async function deleteMealCallback(mealId: number) {
        try {
            log('deleteMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.DELETE });
            const deletedMeal = await deleteMeal(mealId);
            log('deleteMealCallback - success');
            dispatch({ actionState: ActionState.SUCCEEDED, actionType: ActionType.DELETE, data: deletedMeal });
        }
        catch (error) {
            log('deleteMealCallback - failure');
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

            log(`wsEffect - received ${payload}`);
            dispatch({ ...payload, actionState: ActionState.SUCCEEDED });
        });

        ws = webSocket;
        return () => {
            log('wsEffect - disconnectiong');
            cancelled = true;
            webSocket.close();
        }
    }
}

