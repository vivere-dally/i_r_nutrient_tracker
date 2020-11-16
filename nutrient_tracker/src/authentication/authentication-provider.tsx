import { getLogger } from "../core/utils";
import { Credentials } from "./credentials";
import { AuthenticationProps, login } from "./authentication-api";
import React, { useCallback, useEffect, useState } from "react";
import PropTypes from 'prop-types';

export type CredentialsToVoid = (credentials?: Credentials) => void;
interface AuthenticationState extends Credentials, AuthenticationProps {
    login_?: CredentialsToVoid;
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
    const { isAuthenticated, isAuthenticating, authenticationError, token } = state;

    const login_ = useCallback<CredentialsToVoid>(loginCallback, []);
    useEffect(loginEffect, [state.isAuthenticating]);

    const value = { isAuthenticated, isAuthenticating, authenticationError, token, login_ };
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

    function loginEffect() {
        let cancelled = false;
        authenticate();
        return () => {
            cancelled = true;
        }

        async function authenticate() {
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
                    token: authenticationProps.token
                });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                log('loginEffect - authenticate - error');
                setState({
                    ...state,
                    isAuthenticated: false,
                    isAuthenticating: false,
                    authenticationError: error.response.data,
                });
            }
        }
    }
}
