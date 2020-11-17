import { IonButton, IonButtons, IonCheckbox, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonLoading, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import { add } from "ionicons/icons";
import React, { useContext, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { AuthenticationContext } from "../../authentication/authentication-provider";
import { ActionType } from "../../core/action";
import { MealContext } from "../meal-provider";
import '../style/MealPage.css';
import MealListItem from "./MealListItem";

const MealPage: React.FC<RouteComponentProps> = ({ history }) => {
    const { data, actionError, actionType, executing, getAll_, getByComment_, getAllEaten_ } = useContext(MealContext);
    const { logout_ } = useContext(AuthenticationContext);
    const [searchText, setSearchText] = useState('');
    const [eaten, setEaten] = useState<boolean>(false);

    useEffect(() => {
        if (searchText) {
            getByComment_ && getByComment_(searchText);
        }
        else {
            getAll_ && getAll_(false);
        }
    }, [searchText]);

    useEffect(() => {
        if (eaten) {
            getAllEaten_ && getAllEaten_();
        }
        else {
            getAll_ && getAll_(false);
        }
    }, [eaten]);

    const handleLogout = () => {
        logout_ && logout_();
    }

    return (
        <IonPage id="meal-page">
            <IonHeader collapse="condense">
                <IonToolbar>
                    <IonTitle>Meals</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>Logout</IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar value={searchText} onIonChange={e => setSearchText(e.detail.value!)}></IonSearchbar>
                    <IonItem>
                        <IonLabel>Is Eaten</IonLabel>
                        <IonCheckbox value={eaten.toString()} onIonChange={e => setEaten(e.detail.checked || false)} />
                    </IonItem>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonLoading isOpen={executing && actionType === ActionType.GET} message="Fetching meals..." />
                {
                    !executing && !actionError && data && (
                        <IonList>
                            {
                                data
                                    .sort((a, b) => { return b.dateEpoch! - a.dateEpoch!; })
                                    .map(meal =>
                                        <MealListItem key={meal.id?.toString()} meal={meal} />
                                    )
                            }
                        </IonList>
                    )
                }
                {
                    !executing && actionError && (
                        <IonLabel>{actionError.message}</IonLabel>
                    )
                }

                <IonFab slot="fixed" vertical="bottom" horizontal="end">
                    <IonFabButton onClick={() => history.push('/meal')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
}

export default MealPage;
