import { IonHeader, IonItem, IonLabel, IonLoading, IonNote, IonTitle } from '@ionic/react';
import moment from 'moment';
import React from 'react';
import { Meal } from '../meal';
import '../style/MealListItem.css';

interface MealListItemProps {
    meal: Meal;
}

const MealListItem: React.FC<MealListItemProps> = ({ meal }) => {
    return (
        <IonItem routerLink={`/meal/${meal.id}`} detail={false}>
            <IonLabel className="ion-text-wrap">
                <h2>
                    {moment(meal.date).fromNow()}
                    <span className="date">
                        <IonNote>{meal.date && new Date(meal.date).toDateString()}</IonNote>
                    </span>
                </h2>
                <h3>Comments: {meal.comment}</h3>
                <h4>Foods: {meal.foods}</h4>
            </IonLabel>
        </IonItem>
    );
}

export default MealListItem;
