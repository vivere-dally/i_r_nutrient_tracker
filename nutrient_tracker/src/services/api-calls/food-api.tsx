import axios from 'axios';
import { Food } from '../../domain/model/food';
import { environment } from '../../environments/environment';
import { execWithLogs, getLogger } from "../utils";

const log = getLogger('services/api-calls/food-api')
const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export const saveFoodApi: (food: Food) => Promise<Food> = food => {
    return execWithLogs(axiosInstance.post("/food", food, config), 'saveFood', log);
}

export const updateFoodApi: (food: Food) => Promise<Food> = food => {
    return execWithLogs(axiosInstance.put(`/food/${food.id}`, food, config), 'updateFood', log);
}

export const deleteFoodApi: (foodId: number) => Promise<Food> = foodId => {
    return execWithLogs(axiosInstance.delete(`/food/${foodId}`, config), 'deleteFood', log);
}

export const getFoodByIdApi: (foodId: number) => Promise<Food> = foodId => {
    return execWithLogs(axiosInstance.get(`/food/${foodId}`, config), 'getFoodById', log);
}

export const getFoodsApi: () => Promise<Food[]> = () => {
    return execWithLogs(axiosInstance.get("/food", config), 'getFoods', log);
}
