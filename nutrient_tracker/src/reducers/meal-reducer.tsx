import React from 'react';
import { Meal } from '../domain/model/meal';
import { getLogger } from '../services/utils';

const log = getLogger('/reducers/meal-reducer');

export type SaveMealFn = (meal: Meal) => Promise<any>;

export interface MealState {
    meals?: Meal[];
    fetching: boolean;
    fetchingError?: Error | null;
    saving: boolean;
    savingError?: Error | null;
    saveMeal?: SaveMealFn;
}

interface ActionProps {
    type: string;
    payload?: any;
}

export const initialState: MealState = {
    fetching: false,
    saving: false
};

export const FETCH_MEALS_STARTED = 'FETCH_MEALS_STARTED';
export const FETCH_MEALS_SUCCEEDED = 'FETCH_MEALS_SUCCEEDED';
export const FETCH_MEALS_FAILED = 'FETCH_MEALS_FAILED';
export const SAVE_MEAL_STARTED = 'SAVE_MEAL_STARTED';
export const SAVE_MEAL_SUCCEEDED = 'SAVE_MEAL_SUCCEEDED';
export const SAVE_MEAL_FAILED = 'SAVE_MEAL_FAILED';

export const mealReducer: (state: MealState, action: ActionProps) => MealState = (state, { type, payload }) => {
    switch (type) {
        case FETCH_MEALS_STARTED:
            log(FETCH_MEALS_STARTED)
            return { ...state, fetching: true, fetchingError: null };
        case FETCH_MEALS_SUCCEEDED:
            log(FETCH_MEALS_SUCCEEDED)
            return { ...state, meals: payload.meals.data, fetching: false };
        case FETCH_MEALS_FAILED:
            log(FETCH_MEALS_FAILED)
            return { ...state, fetchingError: payload.error, fetching: false };
        case SAVE_MEAL_STARTED:
            log(SAVE_MEAL_STARTED)
            return { ...state, saving: true, savingError: null };
        case SAVE_MEAL_SUCCEEDED:
            log(SAVE_MEAL_SUCCEEDED)
            const meals = [...(state.meals || [])];
            const meal = payload.item;
            const index = meals.findIndex(it => it.id === meal.id);
            if (index === -1) {
                meals.splice(0, 0, meal);
            } else {
                meals[index] = meal;
            }

            return { ...state, meals: meals, saving: false };
        case SAVE_MEAL_FAILED:
            log(SAVE_MEAL_FAILED)
            return { ...state, savingError: payload.error, saving: false };
        default:
            log("default")
            return state;
    }
};

export const MealContext = React.createContext<MealState>(initialState);
