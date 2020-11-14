import axios from 'axios';
import { ActionPayload } from '../core/action';
import { execWithLogs, getLogger } from "../core/utils";
import { environment } from '../environments/environment';
import { Meal } from './meal';

// SETUP
const log = getLogger('meal/meal-api')
const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export const getMealById: (mealId: number) => Promise<Meal> = mealId => {
    return execWithLogs(axiosInstance.get<Meal>(`/meal/${mealId}`, config).then(response => response.data), 'getMealById', log);
}

export const getMeals: () => Promise<Meal[]> = () => {
    return execWithLogs(axiosInstance.get<Meal[]>(`/meal`, config).then(response => response.data), 'getMeals', log);
}

export const saveMeal: (meal: Meal) => Promise<Meal> = meal => {
    return execWithLogs(axiosInstance.post<Meal>("/meal", meal, config).then(response => response.data), 'saveMeal', log);
}

export const updateMeal: (meal: Meal) => Promise<Meal> = meal => {
    return execWithLogs(axiosInstance.put<Meal>(`/meal/${meal.id}`, meal, config).then(response => response.data), 'updateMeal', log);
}

export const deleteMeal: (mealId: number) => Promise<Meal> = mealId => {
    return execWithLogs(axiosInstance.delete<Meal>(`/meal/${mealId}`, config).then(response => response.data), 'deleteMeal', log);
}

export const newMealWebSocket =
    (onMessage: (data: ActionPayload) => void) => {
        const ws = new WebSocket(`${environment.wsUrlApi}topic/meal/notification`);
        ws.onmessage = messageEvent => {
            log('newMealsWebSocket - onmessage');
            onMessage(JSON.parse(messageEvent.data));
        }

        return ws;
    }
