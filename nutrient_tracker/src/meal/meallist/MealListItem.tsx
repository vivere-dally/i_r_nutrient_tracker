import { createAnimation, CreateAnimation, IonIcon, IonImg, IonItem, IonLabel, IonNote, IonThumbnail } from '@ionic/react';
import { cloudDoneSharp, rainySharp, syncCircleSharp } from 'ionicons/icons';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { EntityState } from '../../core/entity';
import { PhotoContext, Photo } from '../../core/photo-provider';
import { Meal } from '../meal';
import './MealListItem.css';

interface MealListItemProps {
    meal: Meal;
}

const MealListItem: React.FC<MealListItemProps> = ({ meal }) => {
    const { read } = useContext(PhotoContext);
    const [photo, setPhoto] = useState<Photo | undefined>();

    useEffect(() => {
        let cancelled = false;
        const loadPhoto = async () => {
            if (!cancelled) {
                const _photo: Photo | undefined = read && await read(meal.userId!, meal.id!);
                setPhoto(_photo);
            }
        }

        loadPhoto();
        return () => {
            cancelled = true;
        }
    }, []);

    function animate() {
        const commentsElement = document.querySelector(`.comments${meal.id}`);
        const foodsElement = document.querySelector(`.foods${meal.id}`);
        if (commentsElement && foodsElement) {
            const commentsAnimation = createAnimation()
                .addElement(commentsElement)
                .duration(1500)
                .iterations(Infinity)
                .fromTo('transform', 'translateX(0px)', 'translateX(100px)');

            const foodsAnimation = createAnimation()
                .addElement(foodsElement)
                .duration(1500)
                .iterations(Infinity)
                .fromTo('transform', 'translateX(0px)', 'translateX(100px)');

            const groupAnimation = createAnimation()
                .addAnimation([commentsAnimation, foodsAnimation]);

            groupAnimation.play();
        }
    }

    useEffect(animate, []);

    return (
        <IonItem routerLink={`/meals/${meal.id}`} detail={false}>
            {
                meal.entityState &&
                (meal.entityState === EntityState.UNCHANGED && (<IonIcon icon={cloudDoneSharp} />)) ||
                (meal.hasConflict && meal.hasConflict === true && meal.entityState === EntityState.UPDATED && (<IonIcon icon={rainySharp} />)) ||
                (<IonIcon icon={syncCircleSharp} />)
            }
            {
                photo &&
                (
                    <IonThumbnail>
                        <IonImg src={photo.webViewPath} />
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
                <h3 className={`comments${meal.id}`}>Comments: {meal.comment}</h3>
                <h4 className={`foods${meal.id}`}>Foods: {meal.foods}</h4>
            </IonLabel>
        </IonItem>
    );
}

export default MealListItem;
