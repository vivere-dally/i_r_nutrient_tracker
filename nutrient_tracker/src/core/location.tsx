import { useCallback, useEffect, useState } from "react";
import { GeolocationPosition, Plugins } from '@capacitor/core';
import { getLogger } from "./utils";


const { Geolocation } = Plugins;


const log = getLogger('core/location')


interface Location {
    position?: GeolocationPosition;
    error?: Error;
}

export const useLocation = () => {
    const [state, setState] = useState<Location>({});

    const updateCurrentLocation = useCallback<() => Promise<void>>(async () => {
        await Geolocation
            .getCurrentPosition()
            .then(position => { setState({ position: position }); })
            .catch(error => { setState({ error: error }); });
    }, []);

    function watchMyLocation() {
        let cancelled = false;
        Geolocation.getCurrentPosition()
            .then(position => { updateMyLocation('current', position); })
            .catch(error => { updateMyLocation('current', error); });
        const watcherId = Geolocation.watchPosition({}, (position, error) => {
            updateMyLocation('watcher', position, error);
        });

        return () => {
            cancelled = true;
            Geolocation.clearWatch({ id: watcherId });
        }

        function updateMyLocation(source: string, position?: GeolocationPosition, error: any = undefined) {
            log(`[${source}] Position: ${position}; Error: ${error}`);
            if (!cancelled) {
                setState({ ...state, position: position || state.position, error });
            }
        }
    }

    useEffect(watchMyLocation, []);

    log('return');
    return [state];
}