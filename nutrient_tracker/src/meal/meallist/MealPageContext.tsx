import React, { useCallback, useState } from "react";
import PropTypes from 'prop-types';
import { getLogger } from "../../core/utils";

const log = getLogger('meallist/meal-page-provider');

export type StringToVoid = (value: string) => void;
export type BooleanToVoid = (value: boolean) => void;

export interface MealPageState {
    searchText: string;
    setSearchText?: StringToVoid;
    isEaten: boolean;
    setIsEaten?: BooleanToVoid;
    isInfiniteScrollingDisabled: boolean
    setIsInfiniteScrollingDisabled?: BooleanToVoid;
}

const mealPageInitialState: MealPageState = {
    searchText: "",
    isEaten: false,
    isInfiniteScrollingDisabled: false
};

export const MealPageContext = React.createContext<MealPageState>(mealPageInitialState);

interface MealPageStateProps {
    children: PropTypes.ReactNodeLike;
}

export const MealPageProvider: React.FC<MealPageStateProps> = ({ children }) => {
    const [state, setState] = useState<MealPageState>(mealPageInitialState);
    const { searchText, isEaten, isInfiniteScrollingDisabled } = state

    const setSearchText = useCallback<StringToVoid>(setSearchTextCallback, [state]);
    const setIsEaten = useCallback<BooleanToVoid>(setIsEatenCallback, [state]);
    const setIsInfiniteScrollingDisabled = useCallback<BooleanToVoid>(setIsInfiniteScrollingDisabledCallback, [state]);

    const value = { searchText, setSearchText, isEaten, setIsEaten, isInfiniteScrollingDisabled, setIsInfiniteScrollingDisabled };

    log('MealPageProvider - return');
    return (
        <MealPageContext.Provider value={value}>
            {children}
        </MealPageContext.Provider>
    )

    function setSearchTextCallback(value: string) {
        setState({ ...state, searchText: value });
    }

    function setIsEatenCallback(value: boolean) {
        setState({ ...state, isEaten: value });
    }

    function setIsInfiniteScrollingDisabledCallback(value: boolean) {
        setState({ ...state, isInfiniteScrollingDisabled: value });
    }
}
