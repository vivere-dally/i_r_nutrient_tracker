import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonLabel, IonList, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { add } from "ionicons/icons";
import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import { AuthenticationContext } from "../../authentication/authentication-provider";
import { ActionType } from "../../core/action";
import { MealContext } from "../meal-provider";
import '../style/MealPage.css';
import MealListItem from "./MealListItem";

const MealPage: React.FC<RouteComponentProps> = ({ history }) => {
    const mealContext = useContext(MealContext);
    const { logout_ } = useContext(AuthenticationContext);

    const handleLogout = () => {
        logout_ && logout_();
    }

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
                        <IonButtons slot="end">
                            <IonButton onClick={handleLogout}>Logout</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonLoading isOpen={mealContext.executing && mealContext.actionType === ActionType.GET} message="Fetching meals..." />
                {
                    !mealContext.executing && !mealContext.actionError && mealContext.data && (
                        <IonList>
                            {
                                mealContext.data
                                    .sort((a, b) => { return b.dateEpoch! - a.dateEpoch!; })
                                    .map(meal =>
                                        <MealListItem key={meal.id?.toString()} meal={meal} />
                                    )
                            }
                        </IonList>
                    )
                }
                {
                    !mealContext.executing && mealContext.actionError && (
                        <IonLabel>{mealContext.actionError.message}</IonLabel>
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
