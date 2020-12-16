import { IonIcon, IonImg, IonItem, IonLabel, IonNote, IonThumbnail } from '@ionic/react';
import { cloudDoneSharp, rainySharp, syncCircleSharp } from 'ionicons/icons';
import moment from 'moment';
import React from 'react';
import { EntityState } from '../../core/entity';
import { Meal } from '../meal';
import './MealListItem.css';

interface MealListItemProps {
    meal: Meal;
}

const MealListItem: React.FC<MealListItemProps> = ({ meal }) => {
    return (
        <IonItem routerLink={`/meals/${meal.id}`} detail={false}>
            {
                meal.entityState &&
                (meal.entityState === EntityState.UNCHANGED && (<IonIcon icon={cloudDoneSharp} />)) ||
                (meal.hasConflict && meal.hasConflict === true && meal.entityState === EntityState.UPDATED && (<IonIcon icon={rainySharp} />)) ||
                (<IonIcon icon={syncCircleSharp} />)
            }
            {
                meal.photo &&
                (
                    <IonThumbnail>
                        <IonImg src={meal.photo} />
                    </IonThumbnail>
                )
            }
            <IonLabel style={{ marginLeft: 10 }} className="ion-text-wrap">
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
