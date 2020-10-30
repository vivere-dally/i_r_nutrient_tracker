import { IonHeader, IonItem, IonLabel, IonNote, IonTitle } from '@ionic/react';
import moment from 'moment';
import React from 'react';
import { Meal } from '../domain/model/meal';
import './MealListItem.css';

interface MealListItemProps {
    meal: Meal;
}

const MealListItem: React.FC<MealListItemProps> = ({ meal }) => {
    return (
        <IonItem routerLink={`/meal/${meal.id}`} detail={false}>
            <IonLabel className="ion-text-wrap">
                <IonHeader>
                    <IonTitle>
                        {moment(meal.mealDate).fromNow()}
                    </IonTitle>
                </IonHeader>
                <IonTitle>
                    {meal.comment}
                    <span className="date">
                        <IonNote>{new Date(meal.mealDate).toLocaleDateString()}</IonNote>
                    </span>
                </IonTitle>
            </IonLabel>
        </IonItem>
    );
}

export default MealListItem;
