import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Plugins } from "@capacitor/core";
import { getLogger } from "./utils";

const { Storage } = Plugins;
const log = getLogger('core/filter-search-text');


export function useStoredState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
    const [state, setState] = useState<T>(defaultValue);

    const getValue = useCallback(async (key: string) => {
        const stringValue = await Storage
            .get({ key: key })
            .then(result => result.value || '')
            .catch(() => '');

        try {
            const value: T = JSON.parse(stringValue);
            setState(value);
        } catch { }
    }, [state]);

    const setValue = useCallback(async (key: string, value: T) => {
        await Storage.set({
            key: key,
            value: JSON.stringify(value)
        });
    }, [state]);

    useEffect(() => {
        getValue(key);
    }, []);

    useEffect(() => {
        setValue(key, state);
    }, [key, state]);

    log('return');
    return [state, setState];
}
