import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from "../../core/utils";
import { AuthenticationContext } from '../authentication-provider';
import { Redirect, Route } from 'react-router';

const log = getLogger('authentication/component/PrivateRoute');

export interface PrivateRouteProps {
    component: PropTypes.ReactNodeLike;
    path: string;
    exact?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
    const { isAuthenticated } = useContext(AuthenticationContext);
    log('PrivateRoute - return');
    return (
        <Route {...rest} render={props => {
            if (isAuthenticated) {
                // @ts-ignore
                return <Component {...props} />
            }

            return <Redirect to={{ pathname: '/login' }} />
        }} />
    )
}
