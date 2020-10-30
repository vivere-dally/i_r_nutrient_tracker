import { IonHeader, IonItem, IonLabel, IonLoading, IonNote, IonTitle } from '@ionic/react';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { Food } from '../domain/model/food';
import { Meal } from '../domain/model/meal';
import { FoodContext } from '../services/providers/food-provider';
import './MealListItem.css';

interface MealListItemProps {
    meal: Meal;
}

const MealListItem: React.FC<MealListItemProps> = ({ meal }) => {
    // const [foods, setFoods] = useState<Food[]>([]);
    const { data } = useContext(FoodContext);
    // useEffect(getFoodsEffect, []);

    const getFoodNames = () => {
        // return foods.join(', ');
        return meal.foodIds.map(foodId => {
            return data?.find(it => it.id === foodId)?.name;
        }).join(', ');
    }

    return (
        <IonItem routerLink={`/meal/${meal.id}`} detail={false}>
            <IonLabel className="ion-text-wrap">
                <h2>
                    {moment(meal.mealDate).fromNow()}
                    <span className="date">
                        <IonNote>{new Date(meal.mealDate).toDateString()}</IonNote>
                    </span>
                </h2>
                <h3>Comments: {meal.comment}</h3>
                <h4>Foods: {getFoodNames()}</h4>
            </IonLabel>
        </IonItem>
    );

    // function getFoodsEffect() {
    //     getFoodById && meal.foodIds.forEach(async foodId => {
    //         const food = await getFoodById(foodId) as Food;
    //         foods.push(food);
    //         setFoods(foods);
    //     });
    // }
}

export default MealListItem;
