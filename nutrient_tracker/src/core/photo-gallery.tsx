import { CameraOptions, CameraResultType, CameraSource } from '@capacitor/core';
import { base64FromPath } from '@ionic/react-hooks/filesystem';
import { useCamera } from '@ionic/react-hooks/camera';
import { getLogger } from "./utils";
import { useCallback } from 'react';


const log = getLogger('core/photo-gallery');
const cameraOptions: CameraOptions = {
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 100
};


export function usePhotoGallery() {
    const { getPhoto } = useCamera();

    const takePhoto = useCallback<() => Promise<string>>(async () => {
        log('[takePhoto] Take Photo init');
        const cameraPhoto = await getPhoto(cameraOptions);
        log('[takePhoto] Take Photo done');
        return await base64FromPath(cameraPhoto.webPath!)
    }, [getPhoto]);

    return [takePhoto];
}
