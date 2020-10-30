import { IonContent, IonHeader, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import MealListItem from "../components/MealListItem";
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

            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">
                            Meals
                        </IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonLoading isOpen={fetching} message="Fetching meals..." />
                {
                    meals && (
                        <IonList>
                            {
                                meals
                                    .sort((a, b) => { return new Date(b.mealDate).getTime() - new Date(a.mealDate).getTime(); })
                                    .map(meal =>
                                        <MealListItem key={meal.id?.toString()} meal={meal} />
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
