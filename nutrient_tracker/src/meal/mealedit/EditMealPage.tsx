import { IonActionSheet, IonBackButton, IonButton, IonButtons, IonContent, IonDatetime, IonFab, IonFabButton, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonPage, IonText, IonTitle, IonToggle, IonToolbar } from '@ionic/react'
import { camera, constructSharp, trash, close } from 'ionicons/icons'
import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { MyGoogleMap } from '../../core/components/MyGoogleMap'
import { MyModal } from '../../core/components/MyModal'
import { usePhotoGallery } from '../../core/photo-gallery'
import { getDateWithOffset, getLogger } from '../../core/utils'
import { Meal } from '../meal'
import { MealContext } from '../meal-provider'
import './EditMealPage.css'

const log = getLogger('meal/component/EditMealPage')
interface MealProps extends RouteComponentProps<{
    id?: string;
}> { }

const EditMealPage: React.FC<MealProps> = ({ history, match }) => {
    // States
    const mealContext = useContext(MealContext);
    const [takePhoto] = usePhotoGallery();
    const [meal, setMeal] = useState<Meal>();
    const [comment, setComment] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString());
    const [foods, setFoods] = useState<string>("");
    const [eaten, setEaten] = useState<boolean>(false);
    const [price, setPrice] = useState<number>(0.0);
    const [hasConflict, setHasConflict] = useState<boolean>(false);
    const [photo, setPhoto] = useState<string>();
    const [photoToDelete, setPhotoToDelete] = useState<string>();
    const [latitude, setLatitude] = useState<number>(46.9);
    const [longitude, setLongitude] = useState<number>(23.59);

    // Effects
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const meal = mealContext.data?.find(it => it.id === Number(routeId));
        setMeal(meal);
        if (meal) {
            setComment(meal.comment || "");
            setDate(meal.date || getDateWithOffset(new Date().toISOString()));
            setFoods(meal.foods || "");
            setEaten(meal.eaten || false);
            setPrice(meal.price || 0.0);
            setHasConflict(meal.hasConflict || false);
            setPhoto(meal.photo!);
            setLatitude(meal.latitude!);
            setLongitude(meal.longitude!);
        }
    }, [match.params.id, mealContext.data]);

    // Handlers
    const handleSaveOrUpdateMeal = () => {
        const actualDate = getDateWithOffset(date)
        const editedMeal = meal ?
            { ...meal, comment: comment, date: actualDate, foods: foods, eaten: eaten, price: price, photo: photo, latitude: latitude, longitude: longitude } :
            { comment: comment, date: actualDate, foods: foods, eaten: eaten, price: price, photo: photo, latitude: latitude, longitude: longitude };

        if (editedMeal.id) {
            mealContext.update && mealContext.update(editedMeal).then(() => history.goBack());
        }
        else {
            mealContext.create && mealContext.create(editedMeal).then(() => history.goBack());
        }
    }

    const handleDeleteMeal = () => {
        meal && meal.id && mealContext.remove && mealContext.remove(meal.id).then(() => history.goBack());
    }

    const handleConflicts = () => {
        history.push(`${match.params.id}/conflict`);
    }

    const handleTakePhoto = async () => {
        const photo: string = await takePhoto();
        setPhoto(photo);
    }

    return (
        <IonPage id="edit-meal-page">
            <IonHeader translucent>
                <IonToolbar>
                    <IonButtons>
                        <IonBackButton text="Meals" defaultHref="/meals" />
                    </IonButtons>
                    <IonTitle>
                        <MyModal showModalText="Open Google Maps" closeModalText="Close Google Maps">
                            <MyGoogleMap
                                latitude={latitude}
                                longitude={longitude}
                                onMapClick={(location: any) => {
                                    setLatitude(location.latLng.lat());
                                    setLongitude(location.latLng.lng());
                                }}
                            />
                        </MyModal>
                    </IonTitle>
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
                    <IonDatetime pickerFormat="MMM DD, YYYY HH:mm" displayFormat="MMM DD, YYYY HH:mm" value={date} onIonChange={e => setDate((e.detail.value === null || e.detail.value === undefined) ? new Date().toISOString() : new Date(e.detail.value).toISOString())} />
                </IonItem>

                <IonItem>
                    <IonLabel>Foods</IonLabel>
                    <IonInput type="text" value={foods} onIonChange={e => setFoods(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                    <IonLabel>IsEaten</IonLabel>
                    <IonToggle checked={eaten} onIonChange={e => setEaten(e.detail.checked || false)} />
                </IonItem>

                <IonItem>
                    <IonLabel>Price</IonLabel>
                    <IonInput type="number" value={price} onIonChange={e => setPrice(Number(e.detail.value) || 0.0)} />
                </IonItem>

                <IonItem>
                    <IonLabel>Latitude: {latitude}</IonLabel>
                </IonItem>

                <IonItem>
                    <IonLabel>Longitude: {longitude}</IonLabel>
                </IonItem>

                <IonItem>
                    <IonImg onClick={() => setPhotoToDelete(photo)} src={photo} alt="This meal has no photo..." />
                    <IonLabel />
                </IonItem>

                {
                    hasConflict && (
                        <IonFab slot="fixed" vertical="bottom" horizontal="start">
                            <IonFabButton onClick={handleConflicts}>
                                <IonIcon icon={constructSharp} />
                            </IonFabButton>
                        </IonFab>
                    )
                }

                <IonFab vertical="bottom" horizontal="center" slot="fixed">
                    <IonFabButton onClick={() => handleTakePhoto()}>
                        <IonIcon icon={camera} />
                    </IonFabButton>
                </IonFab>

                <IonFab slot="fixed" vertical="bottom" horizontal="end">
                    <IonFabButton onClick={handleDeleteMeal}>
                        <IonIcon icon={trash} />
                    </IonFabButton>
                </IonFab>

                <IonActionSheet
                    isOpen={!!photoToDelete}
                    buttons={[
                        {
                            text: 'Delete',
                            role: 'destructive',
                            icon: trash,
                            handler: () => {
                                setPhoto(undefined);
                                setPhotoToDelete(undefined);
                            }
                        },
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            icon: close
                        }
                    ]}
                    onDidDismiss={() => setPhotoToDelete(undefined)}
                />
            </IonContent>
        </IonPage>
    )
}

export default EditMealPage;
