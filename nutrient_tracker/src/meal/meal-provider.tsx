import React, { useCallback, useContext, useEffect, useReducer } from "react";
import PropTypes from 'prop-types';
import { State } from "../core/state";
import { getLogger, getReducer } from "../core/utils";
import { Meal } from "./meal";
import { ActionState, ActionType } from "../core/action";
import { deleteMeal, getMealById, getMeals, newMealWebSocket, saveMeal, setAuthorizationToken, updateMeal } from "./meal-api";
import { AuthenticationContext } from "../authentication/authentication-provider";

interface MealState extends State<Meal, number> {
    save_?: MealParamToPromise,
    update_?: MealParamToPromise,
    delete_?: MealIdParamToPromise,
    get_?: MealIdParamToPromise
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

    const value = { data, executing, actionType, actionError, save_, update_, delete_, getById_ };

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
            if (!authenticationContext.isAuthenticated) {
                return;
            }
            
            setAuthorizationToken(authenticationContext.token);
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
                dispatch({ actionState: ActionState.FAILED, actionType: ActionType.GET, data: error });
            }
        }
    }

    async function saveMealCallback(meal: Meal) {
        try {
            log('saveMealCallback - start');
            dispatch({ actionState: ActionState.STARTED, actionType: ActionType.SAVE });
            saveMeal(meal);
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
            updateMeal(meal);
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
            deleteMeal(mealId);
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

            log(`wsEffect - received ${payload.data}`);
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

