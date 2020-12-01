import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonLoading, IonPage, IonSearchbar, IonTitle, IonToggle, IonToolbar } from "@ionic/react";
import { add, cloudSharp, cloudOfflineSharp } from "ionicons/icons";
import React, { useContext, useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import { AuthenticationContext } from "../../authentication/authentication-provider";
import { ActionType } from "../../core/action";
import { MealContext } from "../meal-provider";
import './MealPage.css';
import MealListItem from "./MealListItem";
import { MealPageContext } from "./MealPageContext";
import { useNetworkStatus } from "../../core/network-status";
import { getLogger } from "../../core/utils";
import { syncMeals } from "../meal-sync";

const log = getLogger('meal/meallist/MealPage.tsx');

const MealPage: React.FC<RouteComponentProps> = ({ history }) => {
    const { data, actionError, actionType, executing, getByComment_, getAllEaten_, getPaged_, setReload_, save_, delete_, get_, update_ } = useContext(MealContext);
    const { logout_ } = useContext(AuthenticationContext);
    const { networkStatus } = useNetworkStatus();
    const mealPageContext = useContext(MealPageContext);

    const [searchTextFilter, setSearchTextFilter] = useState(mealPageContext.searchText);
    const [isEatenFilter, setIsEatenFilter] = useState<boolean>(mealPageContext.isEaten);
    const [isInfiniteScrollingDisabled, setIsInfiniteScrollingDisabled] = useState<boolean>(mealPageContext.isInfiniteScrollingDisabled);
    const [isSyncNeeded, setIsSyncNeeded] = useState<boolean>(false);
    const [networkStatusState, setNetworkStatusState] = useState<boolean>(false);

    useEffect(() => {
        mealPageContext.setSearchText && mealPageContext.setSearchText(searchTextFilter);
        if (searchTextFilter) {
            getByComment_ && getByComment_(searchTextFilter);
        }
    }, [searchTextFilter]);

    useEffect(() => {
        mealPageContext.setIsEaten && mealPageContext.setIsEaten(isEatenFilter);
        if (isEatenFilter) {
            getAllEaten_ && getAllEaten_();
        }
    }, [isEatenFilter]);

    useEffect(() => {
        mealPageContext.setIsInfiniteScrollingDisabled && mealPageContext.setIsInfiniteScrollingDisabled(isInfiniteScrollingDisabled);
    }, [isInfiniteScrollingDisabled]);

    useEffect(() => {
        if (!isSyncNeeded && networkStatus.connected) {
            log('DO SYNC!');
            save_ && delete_ && update_ && get_ && syncMeals(save_, delete_, update_, get_);
        }

        setIsSyncNeeded(networkStatus.connected);
        setNetworkStatusState(networkStatus.connected);
    }, [networkStatus]);

    const handleLogout = () => {
        mealPageContext.setIsInfiniteScrollingDisabled && mealPageContext.setIsInfiniteScrollingDisabled(false);
        setReload_ && setReload_(true);
        logout_ && logout_();
    }

    const handleSearchTextFilter: (value: string | undefined) => void = value => {
        if (searchTextFilter && !value) {
            setIsInfiniteScrollingDisabled(false);
            setReload_ && setReload_(true);
        }
        else {
            setIsInfiniteScrollingDisabled(true);
        }

        setSearchTextFilter(value || '');
    }

    const handleIsEatenFilter: (value: boolean) => void = value => {
        if (isEatenFilter && !value) {
            setIsInfiniteScrollingDisabled(false);
            setReload_ && setReload_(true);
        }
        else {
            setIsInfiniteScrollingDisabled(true);
        }

        setIsEatenFilter(value);
    }

    const handleNext: (e: CustomEvent<void>) => void = e => {
        const result = getPaged_ && getPaged_(false);
        result?.then(isDone => { if (isDone != null && isDone) { setIsInfiniteScrollingDisabled(true) } });
        (e.target as HTMLIonInfiniteScrollElement).complete()
    }

    return (
        <IonPage id="meal-page">
            <IonHeader collapse="condense">
                <IonToolbar>
                    <IonButtons slot="start">
                        {
                            (networkStatusState && (<IonIcon style={{ "zoom": 2.0 }} icon={cloudSharp} />)) ||
                            (!networkStatusState && (networkStatus.connectionType === 'none' || networkStatus.connectionType === 'unknown') && (<IonIcon style={{ "zoom": 2.0 }} icon={cloudOfflineSharp} />))
                        }
                        <IonLabel style={{ marginLeft: 10 }} >{networkStatus.connectionType}</IonLabel>
                    </IonButtons>
                    <IonTitle>Meals</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleLogout}>Logout</IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar value={searchTextFilter} onIonChange={e => handleSearchTextFilter(e.detail.value)}></IonSearchbar>
                    <IonItem>
                        <IonLabel>Is Eaten</IonLabel>
                        <IonToggle checked={isEatenFilter} onIonChange={e => handleIsEatenFilter(e.detail.checked)} />
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
                        <IonLabel>{actionError.message}</IonLabel>
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
