import { useEffect, useState } from 'react';
import { NetworkStatus, Plugins } from '@capacitor/core';
import { getLogger } from './utils';

const log = getLogger('core/network-status')
const { Network } = Plugins;
const initialState = {
    connected: false,
    connectionType: 'unknown'
};

export const useNetworkStatus = () => {
    const [networkStatus, setNetworkStatus] = useState(initialState);

    useEffect(() => {
        const handler = Network.addListener('networkStatusChange', handleNetworkStatusChange);
        Network.getStatus().then(handleNetworkStatusChange);
        let cancelled = false;
        return () => {
            log('useEffect - stop');
            cancelled = true;
            handler.remove();
        }

        function handleNetworkStatusChange(status: NetworkStatus) {
            log('networkStatus - change', status);
            if (!cancelled) {
                setNetworkStatus(status);
            }
        }
    }, []);

    log('return');
    return { networkStatus };
};
