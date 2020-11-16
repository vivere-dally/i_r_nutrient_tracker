import axios from 'axios';
import { execWithLogs, getLogger } from "../core/utils";
import { environment } from '../environments/environment';
import { Credentials } from './credentials';

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
            .then(response => {
                return { token: response.headers['accesstoken'] }
            }),
        'login',
        log);
}
