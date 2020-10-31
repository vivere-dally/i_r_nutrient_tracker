import axios from 'axios';
import { getLogger, execWithLogs, ApiAction } from '../utils';
import { environment } from '../../environments/environment';
import { Meal } from '../../domain/model/meal';
import { ActionProps } from '../reducer';

const log = getLogger('services/api-calls/meal-api');

const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export const saveMealApi: (meal: Meal) => Promise<Meal> = meal => {
    return execWithLogs(axiosInstance.post("/meal", meal, config), 'saveMeal', log);
}

export const updateMealApi: (meal: Meal) => Promise<Meal> = meal => {
    return execWithLogs(axiosInstance.put(`/meal/${meal.id}`, meal, config), 'updateMeal', log);
}

export const deleteMealApi: (mealId: number) => Promise<Meal> = mealId => {
    return execWithLogs(axiosInstance.delete(`/meal/${mealId}`, config), 'deleteMeal', log);
}

export const getMealByIdApi: (mealId: number) => Promise<Meal> = mealId => {
    return execWithLogs(axiosInstance.get(`/meal/${mealId}`, config), 'getMealById', log);
}

export const getMealsApi: () => Promise<Meal[]> = () => {
    return execWithLogs(axiosInstance.get(`/meal`, config), 'getMeals', log);
}

export const newMealsWebSocket = (onMessage: (data: ActionProps) => void) => {
    const ws = new WebSocket(`${environment.wsUrlApi}topic/meal/notification`)
    ws.onopen = () => {
        log('newMealsWebSocket - onopen');
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

    return ws;
}
