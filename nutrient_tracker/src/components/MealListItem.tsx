import { IonDatetime, IonItem, IonLabel } from '@ionic/react';
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
                <IonDatetime value={meal.mealDate} />
            </IonLabel>
        </IonItem>
    );
}

export default MealListItem;
