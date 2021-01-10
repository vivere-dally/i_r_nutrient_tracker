import { createAnimation, IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonLoading, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToast, IonToggle, IonToolbar } from "@ionic/react";
import { add, cloudSharp, cloudOfflineSharp, filter } from "ionicons/icons";
import React, { useContext, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { AuthenticationContext } from "../../authentication/authentication-provider";
import { ActionType } from "../../core/action";
import { MealContext } from "../meal-provider";
import './MealPage.css';
import MealListItem from "./MealListItem";
import { useNetworkStatus } from "../../core/network-status";
import { getLogger } from "../../core/utils";
import { syncMeals } from "../meal-sync";
import { useStoredState } from "../../core/stored-state";

const log = getLogger('meal/meallist/MealPage.tsx');

const MealPage: React.FC<RouteComponentProps> = ({ history }) => {
    const { data, actionError, actionType, executing, create, read, update, remove, removeFromState, get } = useContext(MealContext);
    const { logout_ } = useContext(AuthenticationContext);
    const { networkStatus } = useNetworkStatus();
    const [networkStatusConnected, setNetworkStatusConnected] = useState<boolean>(false);
    const [isSyncNeeded, setIsSyncNeeded] = useState<boolean>(false);

    const [commentFilter, setCommentFilter] = useStoredState<string | undefined>('mealPagecommentFilter', '');
    const [isEatentFilter, setIsEatenFilter] = useStoredState<boolean | undefined>('mealPageIsEatentFilter', undefined);
    const [isInfiniteScrollingDisabled, setIsInfiniteScrollingDisabled] = useState<boolean>(false);
    const [filtersChanged, setFiltersChanged] = useState<boolean>(false);

    useEffect(() => {
        if (isSyncNeeded && !networkStatusConnected && networkStatus.connected) {
            log('SYNC!');
            create && update && remove && removeFromState && syncMeals(create, update, remove, removeFromState);
            setIsSyncNeeded(false);
        } else if (!networkStatus.connected) {
            setIsSyncNeeded(true);
        }

        setNetworkStatusConnected(networkStatus.connected);
    }, [networkStatus]);

    useEffect(() => {
        if (filtersChanged) {
            next();
            setFiltersChanged(false);
        }
    }, [commentFilter, isEatentFilter])

    const handleLogout = () => {
        logout_ && logout_();
    }

    const next = () => {
        const result = get && get(false, commentFilter || null, (isEatentFilter === undefined) ? null : isEatentFilter);
        result?.then(reachedEnd => {
            if (reachedEnd != null) {
                setIsInfiniteScrollingDisabled(reachedEnd);
            }
        });
    }

    const handleNext: (e: CustomEvent<void>) => void = e => {
        next();
        (e.target as HTMLIonInfiniteScrollElement).complete()
    }

    function animate() {
        const networkStatusConnectedIconElement = document.querySelector('.networkStatusConnectedIcon');
        if (networkStatusConnectedIconElement) {
            const networkStatusConnectedIconAnimation = createAnimation()
                .addElement(networkStatusConnectedIconElement)
                .duration(1500)
                .iterations(Infinity)
                .direction('alternate')
                .keyframes([
                    { offset: 0, transform: 'scale(1.5)', opacity: '1' },
                    { offset: 1, transform: 'scale(1)', opacity: '0.7' },
                ]);

            networkStatusConnectedIconAnimation.play();
        }
    }

    useEffect(animate, []);

    return (
        <IonPage id="meal-page">
            <IonHeader collapse="condense">
                <IonToolbar>
                    <IonButtons slot="start">
                        {
                            (networkStatusConnected && (<IonIcon style={{ "zoom": 2.0 }} icon={cloudSharp} className="networkStatusConnectedIcon" />)) ||
                            (!networkStatusConnected && (networkStatus.connectionType === 'none' || networkStatus.connectionType === 'unknown') && (<IonIcon style={{ "zoom": 2.0 }} icon={cloudOfflineSharp} />))
                        }
                        <IonLabel style={{ marginLeft: 10 }} >{networkStatus.connectionType}</IonLabel>
                    </IonButtons>
                    <IonTitle>Meals</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>Logout</IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar value={commentFilter} onIonChange={e => { setFiltersChanged(true); setCommentFilter(e.detail.value); }}></IonSearchbar>
                    <IonItem>
                        <IonLabel>Is Eaten</IonLabel>
                        <IonSelect value={String(isEatentFilter)} onIonChange={e => { setFiltersChanged(true); setIsEatenFilter((e.detail.value === 'undefined') ? undefined : e.detail.value === 'true'); }}>
                            <IonSelectOption value={'undefined'}>All</IonSelectOption>
                            <IonSelectOption value={'true'}>Yes</IonSelectOption>
                            <IonSelectOption value={'false'}>No</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonLoading isOpen={executing && actionType === ActionType.GET} message="Fetching meals..." />
                {
                    !executing && !actionError && data && (
                        <div>
                            <IonList>
                                {
                                    data
                                        .sort((a, b) => { return b.dateEpoch! - a.dateEpoch!; })
                                        .map(meal =>
                                            <MealListItem key={meal.id?.toString()} meal={meal} />
                                        )
                                }
                            </IonList>
                            <IonInfiniteScroll
                                threshold="100px"
                                disabled={isInfiniteScrollingDisabled}
                                onIonInfinite={(e: CustomEvent<void>) => handleNext(e)}>
                                <IonInfiniteScrollContent loadingText="Loading more meals..." />
                            </IonInfiniteScroll>
                        </div>
                    )
                }
                {
                    !executing && actionError && (
                        <IonToast
                            isOpen={actionError !== null || actionError !== undefined}
                            message={actionError.message}
                            position={"bottom"}
                        />
                    )
                }

                <IonFab slot="fixed" vertical="bottom" horizontal="end">
                    <IonFabButton onClick={() => history.push('/meal')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
}

export default MealPage;
