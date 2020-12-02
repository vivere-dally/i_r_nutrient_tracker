import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ActionPayload } from '../core/action';
import { getEtaggedResponse, saveEtaggedResponse } from '../core/etag-management';
import { execWithLogs, getLogger } from "../core/utils";
import { environment } from '../environments/environment';
import { Meal } from './meal';
import { getStorageMealById, resolveMealArrayResponse, resolveMealResponse, storageRemoveMeal, storageSetConflictMeal, storageSetMeal } from './meal-storage';

// SETUP
const log = getLogger('meal/meal-api')
const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config: AxiosRequestConfig = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export const getMealById: (mealId: number) => Promise<Meal> = async mealId => {
    const meal = await getStorageMealById(mealId);
    let _config = config;
    if (meal && meal.etag) {
        _config.headers['If-None-Match'] = meal.etag;
    }

    const promise = axiosInstance
        .get<Meal>(`/meal/${mealId}`, _config)
        .then(response => {
            log('getMealsById - API call.');
            const result = response.data;
            result.etag = response.headers['etag'];
            return resolveMealResponse(result);
        })
        .catch(err => {
            if (err.response.status === 304 && meal) {
                log('getMealsById - 304 - getMealById from storage.');
                return resolveMealResponse(meal);
            }

            throw err;
        });

    return execWithLogs(promise, 'getMealById', log);
}

export async function getMealByIdCallback(mealId: number) {
    getMealById(mealId);
}

export const getMeals: () => Promise<Meal[]> = async () => {
    const key = 'getMeals';
    const ettagedResponse = await getEtaggedResponse(key);
    let _config = config;
    if (ettagedResponse) {
        _config.headers['If-None-Match'] = ettagedResponse.etag;
    }

    const promise = axiosInstance
        .get<Meal[]>(`/meal`, _config)
        .then(response => {
            log('getMeals - API call.');
            saveEtaggedResponse(key, response.headers['etag'] as string, response.data);
            return resolveMealArrayResponse(response.data, getMealByIdCallback);
        })
        .catch(err => {
            if (err.response.status === 304 && ettagedResponse) {
                log('getMeals - 304 - getMeals from storage.');
                return resolveMealArrayResponse(ettagedResponse.payload, getMealByIdCallback);
            }

            throw err;
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const getMealsByComment: (comment: String) => Promise<Meal[]> = async (comment) => {
    const key = `getMealsByComment_${comment}`;
    const ettagedResponse = await getEtaggedResponse(key);
    let _config = config;
    if (ettagedResponse) {
        _config.headers['If-None-Match'] = ettagedResponse.etag;
    }

    const promise = axiosInstance
        .get<Meal[]>(`/meal/filter?comment=${comment}`, _config)
        .then(response => {
            log('getMealsByComment - API call.');
            saveEtaggedResponse(key, response.headers['etag'] as string, response.data);
            return resolveMealArrayResponse(response.data, getMealByIdCallback);
        })
        .catch(err => {
            if (err.response.status === 304 && ettagedResponse) {
                log('getMealsByComment - 304 - getMealsByComment from storage.');
                return resolveMealArrayResponse(ettagedResponse.payload, getMealByIdCallback);
            }

            throw err;
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const getAllEatenMeals: () => Promise<Meal[]> = async () => {
    const key = 'getAllEatenMeals';
    const ettagedResponse = await getEtaggedResponse(key);
    let _config = config;
    if (ettagedResponse) {
        _config.headers['If-None-Match'] = ettagedResponse.etag;
    }

    const promise = axiosInstance
        .get<Meal[]>(`/meal/eaten`, _config)
        .then(response => {
            log('getAllEatenMeals - API call.');
            saveEtaggedResponse(key, response.headers['etag'] as string, response.data);
            return resolveMealArrayResponse(response.data, getMealByIdCallback);
        })
        .catch(err => {
            if (err.response.status === 304 && ettagedResponse) {
                log('getAllEatenMeals - 304 - getAllEatenMeals from storage.');
                return resolveMealArrayResponse(ettagedResponse.payload, getMealByIdCallback);
            }

            throw err;
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const getMealsPaged: (page: number) => Promise<Meal[]> = async (page) => {
    const key = `getMealsPaged_${page}`;
    const ettagedResponse = await getEtaggedResponse(key);
    let _config = config;
    if (ettagedResponse) {
        _config.headers['If-None-Match'] = ettagedResponse.etag;
    }

    const promise = axiosInstance
        .get<Meal[]>(`/meal?page=${page}&size=${environment.pageSize}&sortBy=date.desc`, _config)
        .then(response => {
            log('getMealsPaged - API call.');
            saveEtaggedResponse(key, response.headers['etag'] as string, response.data);
            return resolveMealArrayResponse(response.data, getMealByIdCallback);
        })
        .catch(err => {
            if (err.response.status === 304 && ettagedResponse) {
                log('getMealsPaged - 304 - getMealsPaged from storage.')
                return resolveMealArrayResponse(ettagedResponse.payload, getMealByIdCallback);
            }

            throw err;
        });

    return execWithLogs(promise, 'getMeals', log);
}

export const saveMeal: (meal: Meal) => Promise<Meal> = meal => {
    const promise = axiosInstance
        .post<Meal>("/meal", meal, config)
        .then(response => {
            return resolveMealResponse(response.data, getMealByIdCallback);
        });

    return execWithLogs(promise, 'saveMeal', log);
}

export const updateMeal: (meal: Meal) => Promise<Meal> = async (meal) => {
    if (meal.id) {
        const _meal = await getStorageMealById(meal.id);
        if (_meal) {
            meal.etag = _meal.etag;
        }
    }

    let _config = config;
    if (meal.etag) {
        _config.headers['If-Match'] = meal.etag;
    }

    const promise = axiosInstance
        .put<Meal>(`/meal/${meal.id}`, meal, _config)
        .then(response => {
            return resolveMealResponse(response.data, getMealByIdCallback);
        })
        .catch(async (err) => {
            if (err.message === 'Network Error') {
                await storageSetMeal(meal);
                return meal;
            }

            if (err.response.status === 412) {
                if (meal.id) {
                    meal.etag = undefined;
                    await storageSetMeal(meal);
                    getMealByIdCallback(meal.id);
                }

                storageSetConflictMeal(err.response.data); // Save conflict
                meal.hasConflict = true;
                return meal; // Return old
            }

            throw err;
        });

    return execWithLogs(promise, 'updateMeal', log);
}

export const deleteMeal: (mealId: number) => Promise<Meal> = mealId => {
    const promise = axiosInstance
        .delete<Meal>(`/meal/${mealId}`, config)
        .then(response => {
            storageRemoveMeal(mealId);
            return response.data;
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

export function isNetworkError(error: AxiosError): boolean {
    if (error.response !== undefined) {
        return false;
    }

    return true;
}
