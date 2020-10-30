import { IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { add } from "ionicons/icons";
import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import MealListItem from "../components/MealListItem";
import { MealContext } from "../services/providers/meal-provider";
import { ApiAction, getLogger } from "../services/utils";
import './MealPage.css';

const log = getLogger('pages/MealPage')

const MealPage: React.FC<RouteComponentProps> = ({ history }) => {
    const { data, executing, apiAction, apiActionError } = useContext(MealContext);
    log('render');
    return (
        <IonPage id="meal-page">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Meals</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">
                            Meals
                        </IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonLoading isOpen={executing && apiAction === ApiAction.GET} message="Fetching meals..." />
                {
                    !executing && !apiActionError && data && (
                        <IonList>
                            {
                                data
                                    .sort((a, b) => { return new Date(b.mealDate).getTime() - new Date(a.mealDate).getTime(); })
                                    .map(meal =>
                                        <MealListItem key={meal.id?.toString()} meal={meal} />
                                    )
                            }
                        </IonList>
                    )
                }
                {
                    (!executing && apiAction === ApiAction.GET && apiActionError) && (
                        <IonLabel>{apiActionError.message || 'Failed to fetch meals'}</IonLabel>
                    )
                }

                <IonFab slot="fixed" vertical="bottom" horizontal="end">
                    <IonFabButton onClick={() => history.push('/meal/-1000000')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
}

export default MealPage;
