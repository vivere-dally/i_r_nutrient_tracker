import React, { useCallback, useEffect, useReducer } from "react";
import PropTypes from 'prop-types';
import { Nutrient } from "../../domain/model/nutrient";
import { getReducer, State } from "../reducer";
import { actionBuilder, ActionState, ApiAction, getLogger } from "../utils";
import { deleteNutrient, getNutrientById, getNutrients, saveNutrient, updateNutrient } from "../api-calls/nutrient-api";

export type NutrientParamToPromise = (nutrient: Nutrient) => Promise<any>;
export type NutrientIdParamToPromise = (nutrientId: number) => Promise<any>;

interface NutrientState extends State<Nutrient> {
    saveNutrient?: NutrientParamToPromise,
    updateNutrient?: NutrientParamToPromise,
    deleteNutrient?: NutrientIdParamToPromise,
    getNutrientById?: NutrientIdParamToPromise
};

const nutrientInitialState: NutrientState = {
    executing: false
};

export const NutrientContext = React.createContext<NutrientState>(nutrientInitialState);

const log = getLogger('services/providers/nutrient-provider');
const buildAction = actionBuilder('NUTRIENT');
const reducer = getReducer<NutrientState, Nutrient>('services/providers/nutrient-provider', 'NUTRIENT');

interface NutrientProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const NutrientProvider: React.FC<NutrientProviderProps> = ({ children }) => {
    // States
    const [state, dispatch] = useReducer(reducer, nutrientInitialState);
    const { data, executing, apiAction, apiActionError } = state;

    // Effects
    useEffect(getNutrientsEffect, []);

    // Callbacks
    const saveNutrient = useCallback<NutrientParamToPromise>(saveNutrientCallback, []);
    const updateNutrient = useCallback<NutrientParamToPromise>(updateNutrientCallback, []);
    const deleteNutrient = useCallback<NutrientIdParamToPromise>(deleteNutrientCallback, []);
    const getNutrientById = useCallback<NutrientIdParamToPromise>(getNutrientByIdCallback, []);

    const value = { data, executing, apiAction, apiActionError, saveNutrient, updateNutrient, deleteNutrient, getNutrientById };

    log('NutrientProvider - return');
    return (
        <NutrientContext.Provider value={value}>
            {children}
        </NutrientContext.Provider>
    )

    function getNutrientsEffect() {
        let cancelled = false;

        async function getNutrientsFromApi() {
            try {
                log('getNutrientsEffect - start');
                dispatch({ type: buildAction(ApiAction.GET, ActionState.STARTED) });
                const nutrients = await getNutrients();
                log('getNutrientsEffect - success');
                if (!cancelled) {
                    dispatch({ type: buildAction(ApiAction.GET, ActionState.SUCCEEDED), payload: nutrients });
                }
            }
            catch (error) {
                log('getNutrientsEffect - failure');
                dispatch({ type: buildAction(ApiAction.GET, ActionState.FAILED), payload: error });
            }
        }
    }

    async function saveNutrientCallback(nutrient: Nutrient) {
        try {
            log('saveNutrientCallback - start');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.STARTED) });
            const savedNutrient = await saveNutrient(nutrient);
            log('saveNutrientCallback - success');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.SUCCEEDED), payload: savedNutrient });
        }
        catch (error) {
            log('saveNutrientCallback - failure');
            dispatch({ type: buildAction(ApiAction.SAVE, ActionState.FAILED), payload: error });
        }
    }

    async function updateNutrientCallback(nutrient: Nutrient) {
        try {
            log('updateNutrientCallback - start');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.STARTED) });
            const updatedNutrient = await updateNutrient(nutrient);
            log('updateNutrientCallback - success');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.SUCCEEDED), payload: updatedNutrient });
        }
        catch (error) {
            log('updateNutrientCallback - failure');
            dispatch({ type: buildAction(ApiAction.UPDATE, ActionState.FAILED), payload: error });
        }
    }

    async function deleteNutrientCallback(nutrientId: number) {
        try {
            log('deleteNutrientCallback - start');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.STARTED) });
            const deletedNutrient = await deleteNutrient(nutrientId);
            log('deleteNutrientCallback - success');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.SUCCEEDED), payload: deletedNutrient });
        }
        catch (error) {
            log('deleteNutrientCallback - failure');
            dispatch({ type: buildAction(ApiAction.DELETE, ActionState.FAILED), payload: error });
        }
    }

    async function getNutrientByIdCallback(nutrientId: number) {
        try {
            log('getNutrientByIdCallback - start');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.STARTED) });
            const receivedNutrient = await getNutrientById(nutrientId);
            log('getNutrientByIdCallback - success');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.SUCCEEDED), payload: receivedNutrient });
        }
        catch (error) {
            log('getNutrientByIdCallback - failure');
            dispatch({ type: buildAction(ApiAction.GET_ONE, ActionState.FAILED), payload: error });
        }
    }
}
