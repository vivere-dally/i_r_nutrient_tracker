import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import React, { useContext, useState } from "react";
import { Redirect, RouteComponentProps } from "react-router";
import { getLogger } from "../../core/utils";
import { AuthenticationContext } from "../authentication-provider";
import { Credentials } from "../credentials";

const log = getLogger('authentication/component/AuthenticationPage');

export const AuthenticationPage: React.FC<RouteComponentProps> = ({ history }) => {
    const { isAuthenticated, isAuthenticating, authenticationError, login_ } = useContext(AuthenticationContext);
    const [state, setState] = useState<Credentials>({});

    const handleAuthentication = () => {
        login_ && login_(state);
        setState({});
    }

    log('AuthenticationPage - return');
    if (isAuthenticated) {
        return <Redirect to={{ pathname: '/' }} />
    }

    return (
        <IonPage id="authentication-page">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Authentication</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonLoading isOpen={isAuthenticating} message="Authenticating..." />
                <IonItem>
                    <IonInput type="text" placeholder="Username" value={state.username} onIonChange={e => setState({ ...state, username: e.detail.value || '' })} />
                </IonItem>

                <IonItem>
                    <IonInput type="password" placeholder="Password" value={state.password} onIonChange={e => setState({ ...state, password: e.detail.value || '' })} />
                </IonItem>

                <IonItem>
                    <IonButton onClick={handleAuthentication}>Login</IonButton>
                </IonItem>
                {
                    authenticationError &&
                    (
                        <IonItem>
                            <IonLabel>{authenticationError}</IonLabel>
                        </IonItem>
                    )
                }
            </IonContent>
        </IonPage >
    )
}
