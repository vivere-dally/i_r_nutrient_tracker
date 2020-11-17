import { getLogger } from "../core/utils";
import { Credentials } from "./credentials";
import { AuthenticationProps, login } from "./authentication-api";
import React, { useCallback, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { Storage } from "@capacitor/core";

export type CredentialsToVoid = (credentials?: Credentials) => void;
export type VoidToVoid = () => void;
interface AuthenticationState extends AuthenticationProps {
    login_?: CredentialsToVoid;
    logout_?: VoidToVoid;
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    authenticationError: Error | null;
}

const log = getLogger('authentication/authentication-provider');
const authenticationInitialState: AuthenticationState = {
    token: '',
    isAuthenticated: false,
    isAuthenticating: false,
    authenticationError: null
};

export const AuthenticationContext = React.createContext<AuthenticationState>(authenticationInitialState);
interface AuthenticationProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const AuthenticationProvider: React.FC<AuthenticationProviderProps> = ({ children }) => {
    const [state, setState] = useState<AuthenticationState>(authenticationInitialState);
    const { id, isAuthenticated, isAuthenticating, authenticationError, token } = state;

    const login_ = useCallback<CredentialsToVoid>(loginCallback, []);
    const logout_ = useCallback<VoidToVoid>(logoutCallback, []);
    useEffect(loginEffect, [state.isAuthenticating]);

    const value = { id, isAuthenticated, isAuthenticating, authenticationError, token, login_, logout_ };
    log('AuthenticationProvider - return');
    return (
        <AuthenticationContext.Provider value={value}>
            {children}
        </AuthenticationContext.Provider>
    )

    function loginCallback(credentials?: Credentials): void {
        log('AuthenticationProvider - loginCallback');
        setState({
            ...state,
            isAuthenticating: true,
            username: credentials?.username,
            password: credentials?.password
        });
    }

    function logoutCallback(): void {
        log('AuthenticationProvider - logoutCallback');
        setState({
            ...state,
            isAuthenticated: false,
            token: '',
            id: undefined
        });

        (async () => {
            await Storage.remove({ key: "token" });
            await Storage.remove({ key: "user_id" });
        })();
    }

    function loginEffect() {
        let cancelled = false;
        authenticate();
        return () => {
            cancelled = true;
        }

        async function authenticate() {
            const storageToken = await Storage.get({ key: "token" });
            const storageUserId = await Storage.get({ key: "user_id" });
            if (storageToken.value) {
                log('loginEffect - authenticate - success');
                setState({
                    ...state,
                    isAuthenticated: true,
                    isAuthenticating: false,
                    token: storageToken.value,
                    id: Number(storageUserId.value)
                });

                return;
            }

            if (!state.isAuthenticating) {
                return;
            }

            try {
                log('loginEffect - authenticate');
                const { username, password } = state;
                const authenticationProps = await login({ username, password });
                if (cancelled) {
                    return;
                }

                log('loginEffect - authenticate - success');
                setState({
                    ...state,
                    isAuthenticated: true,
                    isAuthenticating: false,
                    token: authenticationProps.token,
                    id: Number(authenticationProps.id)
                });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                var errorMsg = error.toString();
                if (error.response) {
                    errorMsg = error.response.data;
                }

                log('loginEffect - authenticate - error');
                setState({
                    ...state,
                    isAuthenticated: false,
                    isAuthenticating: false,
                    authenticationError: errorMsg,
                });
            }
        }
    }
}
