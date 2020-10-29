import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from './utils';
import { SaveMealFn, initialState, MealContext, mealReducer, SAVE_MEAL_STARTED, SAVE_MEAL_FAILED, FETCH_MEALS_STARTED, FETCH_MEALS_SUCCEEDED, FETCH_MEALS_FAILED, SAVE_MEAL_SUCCEEDED } from '../reducers/meal-reducer';
import { Meal } from '../domain/model/meal';
import { getMeals, updateMeal } from './meal-api';

const log = getLogger('/services/meal-provider');

interface MealProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const MealProvider: React.FC<MealProviderProps> = ({ children }) => {
    // States
    const [state, dispatch] = useReducer(mealReducer, initialState);
    const { meals, fetching, fetchingError, saving, savingError } = state;

    // Effects
    useEffect(getMealsEffect, []);

    const saveMeal = useCallback<SaveMealFn>(saveMealCallback, []);
    const value = { meals, fetching, fetchingError, saving, savingError, saveMeal };

    log('MealProvider - return');
    return (
        <MealContext.Provider value={value}>
            {children}
        </MealContext.Provider>
    )

    function getMealsEffect() {
        let cancelled = false;
        fetchMeals();
        return () => {
            cancelled = true;
        }

        async function fetchMeals() {
            try {
                log('fetchMeals - start');
                dispatch({ type: FETCH_MEALS_STARTED });
                const meals = await getMeals();
                log('fetchMeals - success');
                if (!cancelled) {
                    dispatch({ type: FETCH_MEALS_SUCCEEDED, payload: { meals } });
                }
            }
            catch (error) {
                log('fetchMeals - failure');
                dispatch({ type: FETCH_MEALS_FAILED, payload: { error } });
            }
        }
    }

    async function saveMealCallback(meal: Meal) {
        try {
            log('saveMeal - start');
            dispatch({ type: SAVE_MEAL_STARTED });
            const savedMeal = await (meal.id ? updateMeal(meal) : saveMeal(meal));
            log('saveMeal - success');
            dispatch({ type: SAVE_MEAL_SUCCEEDED, payload: { meal: savedMeal } });
        }
        catch (error) {
            log('saveMeal - failure');
            dispatch({ type: SAVE_MEAL_FAILED, payload: { error } });
        }
    }
}
