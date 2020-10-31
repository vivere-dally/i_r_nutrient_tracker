import React, { useCallback, useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { actionBuilder, ActionState, ApiAction, getLogger } from '../utils';
import { Meal } from '../../domain/model/meal';
import { deleteMealApi, getMealByIdApi, getMealsApi, newMealsWebSocket, saveMealApi, updateMealApi } from '../api-calls/meal-api';
import { getReducer, State } from '../reducer';

export type MealParamToPromise = (meal: Meal) => Promise<any>;
export type MealIdParamToPromise = (mealId: number) => Promise<any>;

interface MealState extends State<Meal> {
    saveMeal?: MealParamToPromise,
    updateMeal?: MealParamToPromise,
    deleteMeal?: MealIdParamToPromise,
    getMealById?: MealIdParamToPromise
}

const mealInitialState: MealState = {
    executing: false
};

export const MealContext = React.createContext<MealState>(mealInitialState);

const log = getLogger('/services/providers/meal-provider');
const buildAction = actionBuilder('MEAL');
const reducer = getReducer<MealState, Meal>('/services/providers/meal-provider', 'MEAL');

interface MealProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const MealProvider: React.FC<MealProviderProps> = ({ children }) => {
    // States
    const [state, dispatch] = useReducer(reducer, mealInitialState);
    const { data, executing, apiAction, apiActionError } = state;
    let ws: WebSocket;

    // Effects
    useEffect(getMealsEffect, []);
    useEffect(wsEffect, []);

    // Callbacks
    const saveMeal = useCallback<MealParamToPromise>(saveMealCallback, []);
    const updateMeal = useCallback<MealParamToPromise>(updateMealCallback, []);
    const deleteMeal = useCallback<MealIdParamToPromise>(deleteMealCallback, []);
    const getMealById = useCallback<MealIdParamToPromise>(getMealByIdCallback, []);

    const value = { data, executing, apiAction, apiActionError, saveMeal, updateMeal, deleteMeal, getMealById };

    log('MealProvider - return');
    return (
        <MealContext.Provider value={value}>
            {children}
        </MealContext.Provider>
    )

    function getMealsEffect() {
        let cancelled = false;
        getMealsFromApi();
        return () => {
            cancelled = true;
        }

        async function getMealsFromApi() {
            try {
                log('getMealsEffect - start');
                dispatch({ type: buildAction(ApiAction.GET, ActionState.STARTED) });
                const meals = await getMealsApi();
                log('getMealsEffect - success');
                if (!cancelled) {
                    dispatch({ type: buildAction(ApiAction.GET, ActionState.SUCCEEDED), payload: meals });
                }
            }
            catch (error) {
                log('getMealsEffect - failure');
                dispatch({ type: buildAction(ApiAction.GET, ActionState.FAILED), payload: error });
            }
        }
    }

    async function saveMealCallback(meal: Meal) {
        try {
            log('saveMealCallback - start');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.STARTED) });
            const savedMeal = await saveMealApi(meal);
            log('saveMealCallback - success');
            const savedMealSucceeded = { type: buildAction(ApiAction.SAVE, ActionState.SUCCEEDED), payload: savedMeal };
            ws?.send(JSON.stringify(savedMealSucceeded));
            dispatch(savedMealSucceeded);
        }
        catch (error) {
            log('saveMealCallback - failure');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.FAILED), payload: error });
        }
    }

    async function updateMealCallback(meal: Meal) {
        try {
            log('updateMealCallback - start');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.STARTED) });
            const updatedMeal = await updateMealApi(meal);
            log('updateMealCallback - success');
            const updatedMealSucceeded = { type: buildAction(ApiAction.UPDATE, ActionState.SUCCEEDED), payload: updatedMeal };
            ws?.send(JSON.stringify(updatedMealSucceeded));
            dispatch(updatedMealSucceeded);
        }
        catch (error) {
            log('updateMealCallback - failure');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.FAILED), payload: error });
        }
    }

    async function deleteMealCallback(mealId: number) {
        try {
            log('deleteMealCallback - start');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.STARTED) });
            const deletedMeal = await deleteMealApi(mealId);
            log('deleteMealCallback - success');
            const deletedMealSucceeded = { type: buildAction(ApiAction.DELETE, ActionState.SUCCEEDED), payload: deletedMeal };
            ws?.send(JSON.stringify(deletedMealSucceeded));
            dispatch(deletedMealSucceeded);
        }
        catch (error) {
            log('deleteMealCallback - failure');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.FAILED), payload: error });
        }
    }

    async function getMealByIdCallback(mealId: number) {
        try {
            log('getMealByIdCallback - start');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.STARTED) });
            const receivedMeal = await getMealByIdApi(mealId);
            log('getMealByIdCallback - success');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.SUCCEEDED), payload: receivedMeal });
        }
        catch (error) {
            log('getMealByIdCallback - failure');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.FAILED), payload: error });
        }
    }

    function wsEffect() {
        let cancelled = false;
        log('wsEffect - connecting');
        let webSocket = newMealsWebSocket(message => {
            if (cancelled) {
                return;
            }

            const { type, payload } = message;
            log(`wsEffect - received ${payload}`);
            dispatch({ type: type, payload: payload });
        });
        ws = webSocket;

        return () => {
            log('wsEffect - disconnectiong');
            cancelled = true;
            webSocket.close();
        }
    }
}
