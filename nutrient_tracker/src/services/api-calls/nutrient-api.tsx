import axios from 'axios';
import { Nutrient } from '../../domain/model/nutrient';
import { environment } from '../../environments/environment';
import { execWithLogs, getLogger } from "../utils";

const log = getLogger('services/api-calls/nutrient-api');

const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export const saveNutrient: (nutrinet: Nutrient) => Promise<Nutrient> = nutrient => {
    return execWithLogs(axiosInstance.post("/nutrient", nutrient, config), 'saveNutrient', log);
}

export const updateNutrient: (nutrinet: Nutrient) => Promise<Nutrient> = nutrient => {
    return execWithLogs(axiosInstance.put(`/nutrient/${nutrient.id}`, nutrient, config), 'updateNutrient', log);
}

export const deleteNutrient: (nutrinetId: number) => Promise<Nutrient> = nutrinetId => {
    return execWithLogs(axiosInstance.delete(`/nutrient/${nutrinetId}`, config), 'deleteNutrient', log);
}

export const getNutrientById: (nutrinetId: number) => Promise<Nutrient> = nutrinetId => {
    return execWithLogs(axiosInstance.get(`/nutrient/${nutrinetId}`, config), 'getNutrientById', log);
}

export const getNutrients: () => Promise<Nutrient[]> = () => {
    return execWithLogs(axiosInstance.get("/nutirent", config), 'getNutrients', log);
}
