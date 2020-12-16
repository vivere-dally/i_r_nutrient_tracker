import axios, { AxiosRequestConfig } from 'axios';
import { ActionPayload } from '../core/action';
import { getLogger } from "../core/utils";
import { environment } from '../environments/environment';
import { Meal } from './meal';

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



//#region CRUD

export const saveMealApi: (meal: Meal) => Promise<Meal> = meal => {
    return axiosInstance
        .post<Meal>("/meal", meal, config)
        .then(response => {
            log(`[saveMealApi] [${response.status}] Successful API call for meal with id ${response.data.id}.`);
            return response.data;
        });
}

export const getMealByIdApi: (mealId: number, etag: string | null) => Promise<Meal | void> = (mealId, etag) => {
    let _config = config;
    if (etag) {
        _config.headers['If-None-Match'] = etag;
    }

    return axiosInstance
        .get<Meal>(`/meal/${mealId}`, _config)
        .then(response => {
            log(`[getMealByIdApi] [${response.status}] Successful API call for meal with id ${mealId}.`);
            const result: Meal = response.data;
            result.etag = response.headers['etag'];
            return result;
        })
        .catch(err => {
            if (err.response.status === 304) {
                log(`[getMealByIdApi] [304] Successful API call for meal with id ${mealId}.`);
                return;
            }

            throw err;
        });
}

export const updateMealApi: (meal: Meal) => Promise<Meal> = meal => {
    let _config = config;
    if (meal.etag) {
        _config.headers['If-Match'] = meal.etag;
    }

    return axiosInstance
        .put<Meal>(`/meal/${meal.id}`, meal, _config)
        .then(response => {
            log(`[updateMealApi] [${response.status}] Successful API call for meal with id ${response.data.id}.`);
            meal.hasConflict = false;
            return response.data;
        })
        .catch(err => {
            if (err.response.status === 412) {
                log(`[updateMealApi] [412] Successful API call for meal with id ${meal.id}.`);
                meal.hasConflict = true;
                return err.response.data;
            }

            throw err;
        });
}

export const deleteMealByIdApi: (mealId: number) => Promise<Meal> = mealId => {
    return axiosInstance
        .delete<Meal>(`/meal/${mealId}`, config)
        .then(response => {
            log(`[saveMealApi] [${response.status}] Successful API call for meal with id ${response.data.id}.`);
            return response.data;
        });
}

//#endregion

export interface MealBatch {
    meals: Meal[],
    etag: string
}

export const getMealsApi: (page: number, byComment: string | null, isEaten: boolean | null, etag: string | null) => Promise<MealBatch | void> = (page, byComment, isEaten, etag) => {
    let _config = config;
    if (etag) {
        _config.headers['If-None-Match'] = etag;
    }

    let _path = `/meal?page=${page}&size=${environment.pageSize}&sortBy=date.desc`;
    if (byComment) {
        _path = `${_path}&byComment=${byComment}`
    }

    if (isEaten !== null) {
        _path = `${_path}&isEaten=${isEaten}`
    }

    return axiosInstance
        .get<Meal[]>(_path, _config)
        .then(response => {
            log(`[getMealsApi] [${response.status}] Successful API call for path ${_path}.`);
            return {
                meals: response.data,
                etag: response.headers['etag']
            };
        })
        .catch(err => {
            if (err.response.status === 304) {
                log(`[getMealsApi] [304] Successful API call for path ${_path}.`);
                return;
            }

            throw err;
        });
}
