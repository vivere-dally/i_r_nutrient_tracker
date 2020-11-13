import { IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonDatetime, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react'
import { trash } from 'ionicons/icons'
import { stringify } from 'querystring'
import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { getLogger } from '../../core/utils'
import { Meal } from '../meal'
import { MealContext } from '../meal-provider'
import '../style/EditMealPage.css'

const log = getLogger('meal/component/EditMealPage')
interface MealProps extends RouteComponentProps<{
    id?: string;
}> { }

const EditMealPage: React.FC<MealProps> = ({ history, match }) => {
    // States
    const mealContext = useContext(MealContext);
    const [meal, setMeal] = useState<Meal>();
    const [comment, setComment] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString());
    const [foods, setFoods] = useState<string>("");
    const [eaten, setEaten] = useState<boolean>(false);
    const [price, setPrice] = useState<number>(0.0);

    // Effects
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const meal = mealContext.data?.find(it => it.id === Number(routeId));
        setMeal(meal);
        if (meal) {
            setComment(meal.comment || "");
            setDate(meal.date || new Date().toISOString());
            setFoods(meal.foods || "");
            setEaten(meal.eaten || false);
            setPrice(meal.price || 0.0);
        }
    }, [match.params.id, mealContext.data]);

    // Handlers
    const handleSaveOrUpdateMeal = () => {
        const editedMeal = meal ?
            { ...meal, comment: comment, date: date, foods: foods, eaten: eaten, price: price } :
            { comment: comment, date: date, foods: foods, eaten: eaten, price: price };

        if (editedMeal.id) {
            mealContext.update && mealContext.update(editedMeal).then(() => history.goBack());
        }
        else {
            mealContext.save && mealContext.save(editedMeal).then(() => history.goBack());
        }
    }

    const handleDeleteMeal = () => {
        meal && meal.id && mealContext.delete && mealContext.delete(meal.id).then(() => history.goBack());
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
                    <IonInput type="text" value={comment} onIonChange={e => setComment(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                    <IonLabel>Date</IonLabel>
                    <IonDatetime pickerFormat="MMM DD, YYYY HH:mm" displayFormat="MMM DD, YYYY HH:mm" value={date} onIonChange={e => setDate(e.detail.value && new Date(e.detail.value).toISOString() || new Date().toISOString())} />
                </IonItem>

                <IonItem>
                    <IonLabel>Foods</IonLabel>
                    <IonInput type="text" value={foods} onIonChange={e => setFoods(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                    <IonLabel>IsEaten</IonLabel>
                    <IonCheckbox value={eaten.toString()} onIonChange={e => setFoods(e.detail.value || false)} />
                </IonItem>

                <IonItem>
                    <IonLabel>Price</IonLabel>
                    <IonInput type="number" value={price} onIonChange={e => setPrice(Number(e.detail.value) || 0.0)} />
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
