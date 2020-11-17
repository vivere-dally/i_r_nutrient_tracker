import axios, { AxiosError } from 'axios';
import { ActionPayload } from '../core/action';
import { execWithLogs, getLogger } from "../core/utils";
import { environment } from '../environments/environment';
import { Meal } from './meal';
import { Plugins } from "@capacitor/core";
// import NetInfo from "@react-native-community/netinfo";

// SETUP
const { Storage } = Plugins;
const log = getLogger('meal/meal-api')
const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export async function storageSetMeal(meal: Meal) {
    await Storage.set({
        key: String(meal.id),
        value: JSON.stringify(meal)
    });
}

export async function clearMealsFromStorage() {
    const importantKeys: string[] = ['token', 'user_id'];
    await Storage
        .keys()
        .then(allKeys => {
            allKeys.keys.forEach(key => {
                if (importantKeys.indexOf(key) === -1) {
                    Storage.remove({ key });
                }
            });
        });
}

export const getMealById: (mealId: number) => Promise<Meal> = mealId => {
    const promise = axiosInstance
        .get<Meal>(`/meal/${mealId}`, config)
        .then(async (response) => {
            await storageSetMeal(response.data);
            return response.data
        });

    return execWithLogs(promise, 'getMealById', log);
}

export const getMeals: () => Promise<Meal[]> = () => {
    const promise = axiosInstance
        .get<Meal[]>(`/meal`, config)
        .then(response => {
            clearMealsFromStorage();
            response.data.forEach(async (_data) => await storageSetMeal(_data));
            return response.data
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const getMealsByComment: (comment: String) => Promise<Meal[]> = (comment) => {
    const promise = axiosInstance
        .get<Meal[]>(`/meal/filter?comment=${comment}`, config)
        .then(response => {
            clearMealsFromStorage();
            response.data.forEach(async (_data) => await storageSetMeal(_data));
            return response.data
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const getAllEatenMeals: () => Promise<Meal[]> = () => {
    const promise = axiosInstance
        .get<Meal[]>(`/meal/eaten`, config)
        .then(response => {
            clearMealsFromStorage();
            response.data.forEach(async (_data) => await storageSetMeal(_data));
            return response.data
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const saveMeal: (meal: Meal) => Promise<Meal> = meal => {
    const promise = axiosInstance
        .post<Meal>("/meal", meal, config)
        .then(async (response) => {
            await storageSetMeal(response.data);
            return response.data
        });

    return execWithLogs(promise, 'saveMeal', log);
}

export const updateMeal: (meal: Meal) => Promise<Meal> = meal => {
    const promise = axiosInstance
        .put<Meal>(`/meal/${meal.id}`, meal, config)
        .then(async (response) => {
            await storageSetMeal(response.data);
            return response.data
        });

    return execWithLogs(promise, 'updateMeal', log);
}

export const deleteMeal: (mealId: number) => Promise<Meal> = mealId => {
    const promise = axiosInstance
        .delete<Meal>(`/meal/${mealId}`, config)
        .then(async (response) => {
            await Storage.remove({ key: String(response.data.id) });
            return response.data
        });

    return execWithLogs(promise, 'deleteMeal', log);
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

export const setAuthorizationToken: (token: String, userId: number) => void = (token, userId) => {
    axiosInstance.defaults.baseURL = `${environment.urlApi}user/${userId}`;
    axiosInstance.interceptors.request.use(function (config) {
        config.headers.common['Authorization'] = token;
        return config;
    }, function (error) {
        return Promise.reject(error);
    });
}

export async function isNetworkError(error: AxiosError): Promise<boolean> {
    // if (!await NetInfo.fetch().then(state => state.isConnected)) {
    //     return false;
    // }

    if (error.response !== undefined) {
        return false;
    }

    return true;
}
