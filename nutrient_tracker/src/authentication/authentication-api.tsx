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

export interface AuthenticationProps extends Credentials {
    token: string;
}

export const login: (credentials: Credentials) => Promise<AuthenticationProps> = (credentials) => {
    return execWithLogs(
        axiosInstance
            .post<AuthenticationProps>("/login", credentials, config)
            .then(async (response) => {
                await Storage.set({ key: "token", value: response.headers['accesstoken'] });
                const fullUser = await execWithLogs(
                    axiosInstance
                        .get<Credentials>(`/user/getByUsername?username=${credentials.username}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': response.headers['accesstoken']
                            }
                        })
                        .then(second_response => {
                            console.log(second_response);
                            return second_response.data;
                        })
                        .catch(err => {
                            console.log(JSON.stringify(err));
                            return credentials;
                        }),
                    'login',
                    log
                );

                await Storage.set({ key: "user_id", value: String(fullUser.id) });
                return { id: fullUser.id, username: fullUser.username, password: fullUser.password, token: response.headers['accesstoken'] }
            }),
        'login',
        log);
}
