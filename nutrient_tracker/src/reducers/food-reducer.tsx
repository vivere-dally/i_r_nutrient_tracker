import { Food } from "../domain/model/food";
import { getLogger } from "../services/utils";

const log = getLogger('reducers/food-reducer');

export type SaveFoodFn = (food: Food) => Promise<any>

export interface FoodState {
    foods?: Food[];
    fetching: boolean;
    fetchingError?: Error | null;
    saving: boolean;
    savingError?: Error | null;
    saveFood?: SaveFoodFn;
}

export const initialState: FoodState = {
    fetching: false,
    saving: false
}

export const FETCH_FOODS_STARTED = 'FETCH_FOODS_STARTED';
export const FETCH_FOODS_SUCCEEDED = 'FETCH_FOODS_SUCCEEDED';
export const FETCH_FOODS_FAILED = 'FETCH_FOODS_FAILED';
export const SAVE_FOOD_STARTED = 'SAVE_FOOD_STARTED';
export const SAVE_FOOD_SUCCEEDED = 'SAVE_FOOD_SUCCEEDED';
export const SAVE_FOOD_FAILED = 'SAVE_FOOD_FAILED';
