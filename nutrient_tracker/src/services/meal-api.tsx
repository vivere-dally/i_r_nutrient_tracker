import axios from 'axios';
import { getLogger, execWithLogs } from './utils';
import { environment } from '../environments/environment';
import { Meal } from '../domain/model/meal';

//#region Setup

const log = getLogger('services/meal-api');
const axiosInstance = axios.create({
    baseURL: environment.urlApi
});
const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

//#endregion

export const saveMeal: (meal: Meal) => Promise<Meal> = meal => {
    return execWithLogs(axiosInstance.post("/meal", meal, config), 'saveMeal', log);
}

export const updateMeal: (meal: Meal) => Promise<Meal> = meal => {
    return execWithLogs(axiosInstance.put(`/meal/${meal.id}`, meal, config), 'updateMeal', log);
}

export const deleteMeal: (mealId: number) => Promise<Meal> = mealId => {
    return execWithLogs(axiosInstance.delete(`/meal/${mealId}`, config), 'deleteMeal', log);
}

export const getMealById: (mealId: number) => Promise<Meal> = mealId => {
    return execWithLogs(axiosInstance.get(`/meal/${mealId}`, config), 'getMealById', log);
}

export const getMeals: () => Promise<Meal[]> = () => {
    return execWithLogs(axiosInstance.get(`/meal`, config), 'getMeals', log);
}

export const newMealsWebSocket = (onMessage: (data: string) => void) => {
    const ws = new WebSocket(`${environment.wsUrlApi}/meal-notifications`)
    ws.onopen = () => {
        log('newMealsWebSocket - opopen');
    };

    ws.onclose = () => {
        log('newMealsWebSocket - onclose');
    };

    ws.onerror = () => {
        log('newMealsWebSocket - onerror');
    };

    ws.onmessage = messageEvent => {
        log('newMealsWebSocket - onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };

    return () => {
        ws.close();
    }
}
