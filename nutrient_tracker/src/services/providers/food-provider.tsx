import React, { ReactPropTypes, useCallback, useEffect, useReducer } from "react";
import PropTypes from 'prop-types';
import { Food } from "../../domain/model/food";
import { getReducer, State } from "../reducer";
import { actionBuilder, ActionState, ApiAction, getLogger } from "../utils";
import { deleteFoodApi, getFoodByIdApi, getFoodsApi, saveFoodApi, updateFoodApi } from "../api-calls/food-api";

export type FoodSaveOrUpdatePromiseWrapper = (food: Food) => Promise<any>;
export type FoodGetOneOrDeletePromiseWrapper = (foodId: number) => Promise<any>;

interface FoodState extends State<Food> {
    saveFood?: FoodSaveOrUpdatePromiseWrapper,
    updateFood?: FoodSaveOrUpdatePromiseWrapper,
    deleteFood?: FoodGetOneOrDeletePromiseWrapper,
    getFoodById?: FoodGetOneOrDeletePromiseWrapper
};

const foodInitialState: FoodState = {
    executing: false
};

export const FoodContext = React.createContext<FoodState>(foodInitialState);
const log = getLogger('/services/providers/food-provider');
const buildAction = actionBuilder('FOOD');
const reducer = getReducer<FoodState, Food>('/services/providers/food-provider', 'FOOD');

interface FoodProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const FoodProvider: React.FC<FoodProviderProps> = ({ children }) => {
    // States
    const [state, dispatch] = useReducer(reducer, foodInitialState);
    const { data, executing, apiAction, apiActionError } = state;

    // Effects
    useEffect(getFoodsEffect, []);

    // Callbacks
    const saveFood = useCallback<FoodSaveOrUpdatePromiseWrapper>(saveFoodCallback, []);
    const updateFood = useCallback<FoodSaveOrUpdatePromiseWrapper>(updateFoodCallback, []);
    const deleteFood = useCallback<FoodGetOneOrDeletePromiseWrapper>(deleteFoodCallback, []);
    const getFoodById = useCallback<FoodGetOneOrDeletePromiseWrapper>(getFoodByIdCallback, []);
    
    const value = { data, executing, apiAction, apiActionError, saveFood, updateFood, deleteFood, getFoodById };

    log('FoodProvider - return');
    return (
        <FoodContext.Provider value={value}>
            {children}
        </FoodContext.Provider>
    )

    function getFoodsEffect() {
        let cancelled = false;
        getFoodsFromApi();
        return () => {
            cancelled = true;
        }

        async function getFoodsFromApi() {
            try {
                log('getFoodsEffect - start');
                dispatch({ type: buildAction(ApiAction.GET, ActionState.STARTED) });
                const foods = await getFoodsApi();
                log('getFoodsEffect - success');
                if (!cancelled) {
                    dispatch({ type: buildAction(ApiAction.GET, ActionState.SUCCEEDED), payload: foods });
                }
            }
            catch (error) {
                log('getFoodsEffect - failure');
                dispatch({ type: buildAction(ApiAction.GET, ActionState.FAILED), payload: error });
            }
        }
    }

    async function saveFoodCallback(food: Food) {
        try {
            log('saveFoodCallback - start');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.STARTED) });
            const savedFood = await saveFoodApi(food);
            log('saveFoodCallback - success');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.SUCCEEDED), payload: savedFood });
        }
        catch (error) {
            log('saveFoodCallback - failure');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.FAILED), payload: error });
        }
    }

    async function updateFoodCallback(food: Food) {
        try {
            log('updateFoodCallback - start');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.STARTED) });
            const updatedFood = await updateFoodApi(food);
            log('updateFoodCallback - success');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.SUCCEEDED), payload: updatedFood });
        }
        catch (error) {
            log('updateFoodCallback - failure');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.FAILED), payload: error });
        }
    }

    async function deleteFoodCallback(foodId: number) {
        try {
            log('deleteFoodCallback - start');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.STARTED) });
            const deletedFood = await deleteFoodApi(foodId);
            log('deleteFoodCallback - success');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.SUCCEEDED), payload: deletedFood });
        }
        catch (error) {
            log('deleteFoodCallback - failure');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.FAILED), payload: error });
        }
    }

    async function getFoodByIdCallback(foodId: number) {
        try {
            log('getFoodByIdCallback - start');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.STARTED) });
            const receivedFood = await getFoodByIdApi(foodId);
            log('getFoodByIdCallback - success');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.SUCCEEDED), payload: receivedFood });
        }
        catch (error) {
            log('getFoodByIdCallback - failure');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.FAILED), payload: error });
        }
    }
}
