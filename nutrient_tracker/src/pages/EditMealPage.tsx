import { IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react'
import { trash } from 'ionicons/icons'
import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Meal } from '../domain/model/meal'
import { FoodContext } from '../services/providers/food-provider'
import { MealContext } from '../services/providers/meal-provider'
import { getLogger } from '../services/utils'
import './EditMealPage.css'

const log = getLogger('/pages/EditMealPage')

interface MealProps extends RouteComponentProps<{
    id?: string;
}> { }

const EditMealPage: React.FC<MealProps> = ({ history, match }) => {
    // States
    const { data, saveMeal, updateMeal, deleteMeal } = useContext(MealContext);
    const foodContext = useContext(FoodContext);
    const [meal, setMeal] = useState<Meal>();
    const [mealComment, setMealComment] = useState<string>("");
    const [mealDate, setMealDate] = useState<string>(new Date().toISOString());
    const [foodIds, setFoodIds] = useState<number[]>([]);

    // Effects
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const meal = data?.find(it => it.id === Number(routeId));
        setMeal(meal);
        if (meal) {
            setMealComment(meal.comment);
            setMealDate(meal.mealDate);
        }
    }, [match.params.id, data]);

    // Handlers
    const handleSaveOrUpdateMeal = () => {
        const editedMeal = meal ?
            { ...meal, comment: mealComment, mealDate: mealDate, foodIds: foodIds } :
            { comment: mealComment, mealDate: mealDate, foodIds: foodIds };

        if (editedMeal.id) {
            updateMeal && updateMeal(editedMeal).then(() => history.goBack());
        }
        else {
            saveMeal && saveMeal(editedMeal).then(() => history.goBack());
        }
    }

    const handleDeleteMeal = () => {
        meal && meal.id && deleteMeal && deleteMeal(meal.id).then(() => history.goBack());
    }

    return (
        <IonPage id="edit-meal-page">
            <IonHeader translucent>
                <IonToolbar>
                    <IonButtons>
                        <IonBackButton text="Meals" defaultHref="/meal" />
                    </IonButtons>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSaveOrUpdateMeal}>Save</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonItem>
                    <IonLabel>Comment</IonLabel>
                    <IonInput type="text" value={mealComment} onIonChange={e => setMealComment(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                    <IonLabel>Date</IonLabel>
                    <IonDatetime pickerFormat="MMM DD, YYYY HH:mm" displayFormat="MMM DD, YYYY HH:mm" value={mealDate} onIonChange={e => setMealDate(e.detail.value && new Date(e.detail.value).toISOString() || '')} />
                </IonItem>

                <IonItem>
                    <IonLabel>Foods</IonLabel>
                    <IonSelect placeholder="Select foods" multiple onIonChange={e => { setFoodIds(foodIds => [...foodIds, ...e.detail.value]);}}>
                        {
                            foodContext.data && foodContext.data.map(food => {
                                return (
                                    <IonSelectOption value={food.id} key={food.id}>{food.name}</IonSelectOption>
                                )
                            })
                        }
                    </IonSelect>
                </IonItem>

                <IonFab slot="fixed" vertical="bottom" horizontal="end">
                    <IonFabButton onClick={handleDeleteMeal}>
                        <IonIcon icon={trash} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    )
}

export default EditMealPage;
