import { CameraOptions, CameraPhoto, CameraResultType, CameraSource, FilesystemDirectory, Storage } from '@capacitor/core';
import { base64FromPath, useFilesystem } from '@ionic/react-hooks/filesystem';
import { useCamera } from '@ionic/react-hooks/camera';
import { base64StringToBlob, getLogger } from "./utils";
import { useCallback, useEffect, useState } from 'react';


const log = getLogger('core/photo-gallery');
const PHOTO_STORAGE = 'photos';
const PHOTO_FILE_SYSTEM_DIR = 'nutrient_tracker_photos';
const PHOTO_CONTENT_TYPE = "image/jpeg";
const cameraOptions: CameraOptions = {
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 100
};

export interface Photo {
    mealId: number;
    filePath: string;
    webViewPath?: string;
}

export function usePhotoGallery() {
    const { getPhoto } = useCamera();

    const takePhoto = useCallback<() => Promise<string>>(async () => {
        const cameraPhoto = await getPhoto(cameraOptions);
        return await base64FromPath(cameraPhoto.webPath!)
    }, [getPhoto]);

    return [takePhoto];
}

function getPhotoFileName(mealId: number): string {
    return `${PHOTO_FILE_SYSTEM_DIR}/${mealId}.jpeg`;
}

export function usePhotoGalleryNew() {
    const { getPhoto } = useCamera();
    const { writeFile, readFile, deleteFile } = useFilesystem();
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        const loadStoredPhotos = async () => {
            const storedPhotosAsString = await Storage.get({ key: PHOTO_STORAGE });
            const storedPhotos = (storedPhotosAsString ? JSON.parse(storedPhotosAsString.value) : []) as Photo[];
            for (let photo of storedPhotos) {
                const file = await readFile({
                    path: photo.filePath,
                    directory: FilesystemDirectory.Data
                });

                const blob: Blob = base64StringToBlob(file.data, PHOTO_CONTENT_TYPE);
                const blobURL: string = URL.createObjectURL(blob);
                photo.webViewPath = blobURL;
            }

            setPhotos(storedPhotos);
        }

        loadStoredPhotos();
    }, []);

    const setPhotoPrivate = async (mealId: number, cameraPhoto: CameraPhoto): Promise<Photo> => {
        const fileName = getPhotoFileName(mealId);
        const base64Data = await base64FromPath(cameraPhoto.webPath!);
        await writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });

        return {
            mealId: mealId,
            filePath: fileName,
            webViewPath: cameraPhoto.webPath
        };
    }

    const setPhoto = async (mealId: number, base64Data: string): Promise<Photo> => {
        const fileName = getPhotoFileName(mealId);
        await writeFile({
            path: fileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });

        const blob: Blob = base64StringToBlob(base64Data, PHOTO_CONTENT_TYPE);
        const blobURL: string = URL.createObjectURL(blob);
        return {
            mealId: mealId,
            filePath: fileName,
            webViewPath: blobURL
        };
    }

    const takePhoto = async (mealId: number): Promise<string | undefined> => {
        const cameraPhoto = await getPhoto(cameraOptions);
        const photo = await setPhotoPrivate(mealId, cameraPhoto);

        const statePhotos = [...(photos || [])];
        const index = statePhotos.findIndex(it => it.mealId === mealId);
        if (index === -1) {
            statePhotos.splice(0, 0, photo);
        }
        else {
            statePhotos[index] = photo;
        }

        await Storage.set({ key: PHOTO_STORAGE, value: JSON.stringify(statePhotos) });
        setPhotos(statePhotos);
        return photo.webViewPath;
    }

    const readPhoto = (mealId: number): string | undefined => {
        const index = photos.findIndex(it => it.mealId === mealId);
        if (index !== -1) {
            return photos[index].webViewPath;
        }
    }

    const removePhoto = async (mealId: number) => {
        const statePhotos = [...(photos || [])];
        const index = statePhotos.findIndex(it => it.mealId === mealId);
        if (index !== -1) {
            const photo = statePhotos[index];
            statePhotos.splice(index, 1);
            await deleteFile({
                path: photo.filePath,
                directory: FilesystemDirectory.Data
            });
            await Storage.set({ key: PHOTO_STORAGE, value: JSON.stringify(statePhotos) });
            setPhotos(statePhotos);
        }
    }

    return [takePhoto, setPhoto, readPhoto, removePhoto];
}
