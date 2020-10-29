import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import { MealContext } from "../reducers/meal-reducer";
import { getLogger } from "../services/utils";

const log = getLogger('pages/Meal')

const Meal: React.FC<RouteComponentProps> = ({ history }) => {
    const { meals, fetching, fetchingError } = useContext(MealContext);
    log('render');
    return (
        <IonPage id="meal-page">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Meals</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching meals..." />
                {
                    meals && (
                        <IonList>
                            {
                                meals.map(({ id, comment, mealDate }) =>
                                    <IonLabel key={id?.toString()} id={id?.toString()}>{id + " " + comment + " " + mealDate}</IonLabel>
                                )
                            }
                        </IonList>
                    )
                }
                {
                    fetchingError && (
                        <IonLabel>{fetchingError.message || 'Failed to fetch meals'}</IonLabel>
                    )
                }
            </IonContent>
        </IonPage>
    );
}

export default Meal;
