import axios from 'axios';
import { execWithLogs, getLogger } from "../core/utils";
import { environment } from '../environments/environment';
import { Credentials } from './credentials';
import { Plugins } from "@capacitor/core";

const { Storage } = Plugins;
const log = getLogger('authentication/authentication-api')
const axiosInstance = axios.create({
    baseURL: environment.urlApi
});

const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

export interface AuthenticationProps {
    token: string;
}

export const login: (credentials: Credentials) => Promise<AuthenticationProps> = (credentials) => {
    return execWithLogs(
        axiosInstance
            .post<AuthenticationProps>("/login", credentials, config)
            .then(async (response) => {
                await Storage.set({ key: "token", value: response.headers['accesstoken'] });
                return { token: response.headers['accesstoken'] }
            }),
        'login',
        log);
}
