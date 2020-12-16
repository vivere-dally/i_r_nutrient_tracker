import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonPage, IonRadio, IonRadioGroup, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router"
import { getLogger } from "../../core/utils"
import { Meal } from "../meal";
import { MealContext } from "../meal-provider";
import { deleteStoredMealById, getStoredMealById } from "../meal-storage";

const log = getLogger('meal/component/MealConflictPage')
interface MealProps extends RouteComponentProps<{
    id?: string;
}> { }

const MealConflictPage: React.FC<MealProps> = ({ history, match }) => {
    const mealContext = useContext(MealContext);
    const [mealLeft, setMealLeft] = useState<Meal>();
    const [mealRight, setMealRight] = useState<Meal>();
    const [comment, setComment] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString());
    const [foods, setFoods] = useState<string>("");
    const [eaten, setEaten] = useState<boolean>(false);
    const [price, setPrice] = useState<number>(0.0);

    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const _meal = mealContext.data?.find(it => it.id === Number(routeId));
        setMealLeft(_meal);
        (async () => {
            const meal_ = await getStoredMealById(Number(routeId), true);
            if (meal_) {
                setMealRight(meal_);
            }
        })();
        if (_meal) {
            setComment(_meal.comment!);
            setDate(_meal.date!);
            setFoods(_meal.foods!);
            setEaten(_meal.eaten!);
            setPrice(_meal.price!);
        }
    }, [match.params.id, mealContext.data]);

    function handleSave() {
        const meal: Meal = mealLeft ?
            { ...mealLeft, comment: comment, date: date, foods: foods, eaten: eaten, price: price } :
            { comment: comment, date: date, foods: foods, eaten: eaten, price: price };
        mealContext.update && mealContext.update(meal).then(() => {
            const routeId = match.params.id || '';
            deleteStoredMealById(Number(routeId), true);
            history.go(-2);
        });
    }

    return (
        <IonPage id="edit-meal-page">
            <IonHeader translucent>
                <IonToolbar>
                    <IonButtons>
                        <IonBackButton text="Edit" defaultHref="/?" />
                    </IonButtons>
                    <IonTitle>Solve conlicts</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>Save</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonGrid>
                    {/* COMMENT */}
                    <IonRadioGroup value={comment} onIonChange={e => setComment(e.detail.value)}>
                        <IonRow>
                            <IonCol>
                                <IonRadio value={mealLeft?.comment} />
                                <IonLabel>Comment: {mealLeft?.comment}</IonLabel>
                            </IonCol>
                            <IonCol>
                                <IonRadio value={mealRight?.comment} />
                                <IonLabel>Comment: {mealRight?.comment}</IonLabel>
                            </IonCol>
                        </IonRow>
                    </IonRadioGroup>

                    {/* DATE */}
                    <IonRadioGroup value={date} onIonChange={e => setDate(e.detail.value)}>
                        <IonRow>
                            <IonCol>
                                <IonRadio value={mealLeft?.date} />
                                <IonLabel>Date: {mealLeft?.date}</IonLabel>

                            </IonCol>
                            <IonCol>
                                <IonRadio value={mealRight?.date} />
                                <IonLabel>Date: {mealRight?.date}</IonLabel>
                            </IonCol>
                        </IonRow>
                    </IonRadioGroup>

                    {/* FOODS */}
                    <IonRadioGroup value={foods} onIonChange={e => setFoods(e.detail.value)}>
                        <IonRow>
                            <IonCol>
                                <IonRadio value={mealLeft?.foods} />
                                <IonLabel>Foods: {mealLeft?.foods}</IonLabel>
                            </IonCol>
                            <IonCol>
                                <IonRadio value={mealRight?.foods} />
                                <IonLabel>Foods: {mealRight?.foods}</IonLabel>
                            </IonCol>
                        </IonRow>
                    </IonRadioGroup>

                    {/* IS_EATEN */}
                    <IonRadioGroup value={eaten} onIonChange={e => setEaten(e.detail.value)}>
                        <IonRow>
                            <IonCol>
                                <IonRadio value={mealLeft?.eaten} />
                                <IonLabel>IsEaten: {String(mealLeft?.eaten)}</IonLabel>
                            </IonCol>
                            <IonCol>
                                <IonRadio value={mealRight?.eaten} />
                                <IonLabel>IsEaten: {String(mealRight?.eaten)}</IonLabel>
                            </IonCol>
                        </IonRow>
                    </IonRadioGroup>

                    {/* PRICE */}
                    <IonRadioGroup value={price} onIonChange={e => setPrice(e.detail.value)}>
                        <IonRow>
                            <IonCol>
                                <IonRadio value={mealLeft?.price} />
                                <IonLabel>Price: {mealLeft?.price}</IonLabel>
                            </IonCol>
                            <IonCol>
                                <IonRadio value={mealRight?.price} />
                                <IonLabel>Price: {mealRight?.price}</IonLabel>
                            </IonCol>
                        </IonRow>
                    </IonRadioGroup>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
}

export default MealConflictPage;