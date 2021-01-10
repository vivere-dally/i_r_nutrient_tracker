import { CameraOptions, CameraResultType, CameraSource, FilesystemDirectory, Storage } from "@capacitor/core";
import React, { useCallback, useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { base64StringToBlob } from "./utils";
import { useCamera } from "@ionic/react-hooks/camera";
import { base64FromPath, useFilesystem } from "@ionic/react-hooks/filesystem";
import { environment } from "../environments/environment";

const cameraOptions: CameraOptions = {
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 100
};

function getPhotoFileName(userId: number, id: number, dir: string = environment.photo.fileSystem, fileExtension: string = environment.photo.extension): string {
    return `${dir}/${userId}-${id}.${fileExtension}`;
};

export interface Photo {
    userId: number;
    id: number;
    webViewPath: string;
};

export interface PhotoContextType {
    load?: (userId: number, id: number) => Promise<void>;
    take?: (userId: number, id: number) => Promise<Photo>;
    read?: (userId: number, id: number) => Promise<Photo | undefined>;
    delete?: (userId: number, id: number) => Promise<Photo | undefined>;
};

interface PhotoProviderProps {
    children: PropTypes.ReactNodeLike;
};

const photoContextInitialState: PhotoContextType = {};
export const PhotoContext = React.createContext<PhotoContextType>(photoContextInitialState);
export const PhotoProvider: React.FC<PhotoProviderProps> = ({ children }) => {
    const { getPhoto } = useCamera();
    const { writeFile, readFile, deleteFile } = useFilesystem();
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        const loadStoredPhotos = async () => {
            const storedPhotosAsString = await Storage.get({ key: environment.photo.localStorage });
            const storedPhotos = (storedPhotosAsString.value ? JSON.parse(storedPhotosAsString.value) : []) as Photo[];
            for (let photo of storedPhotos) {
                const photoFileName = getPhotoFileName(photo.userId, photo.id);
                photo.webViewPath = await loadPhotoFromFileSystem(photoFileName);
            }

            setPhotos(storedPhotos);
        };

        loadStoredPhotos();
    }, []);

    const load = useCallback<(userId: number, id: number) => Promise<void>>(loadPhoto, [photos]);
    const take = useCallback<(userId: number, id: number) => Promise<Photo>>(takePhoto, [photos]);
    const read = useCallback<(userId: number, id: number) => Promise<Photo | undefined>>(readPhoto, [photos]);
    const remove = useCallback<(userId: number, id: number) => Promise<Photo | undefined>>(removePhoto, [photos]);

    const value = { load, take, read, remove };
    return (
        <PhotoContext.Provider value={value}>
            {children}
        </PhotoContext.Provider>
    );

    function createBlobURL(data: string): string {
        const blob: Blob = base64StringToBlob(data, environment.photo.contentType);
        const blobURL: string = URL.createObjectURL(blob);
        return blobURL;
    }

    async function loadPhotoFromFileSystem(photoFileName: string): Promise<string> {
        const photoFile = await readFile({
            path: photoFileName,
            directory: FilesystemDirectory.Data
        });

        return createBlobURL(photoFile.data);
    }

    async function loadPhoto(userId: number, id: number): Promise<void> {
        const statePhotos = [...photos];
        const index = statePhotos.findIndex(it => it.userId === userId && it.id === id);
        if (index === -1) {
            const photoFileName = getPhotoFileName(userId, id);
            const photoWebViewPath = await loadPhotoFromFileSystem(photoFileName);
            const photo: Photo = { userId: userId, id: id, webViewPath: photoWebViewPath };
            statePhotos.push(photo);
            setPhotos(statePhotos);
        }
    }

    async function takePhoto(userId: number, id: number): Promise<Photo> {
        const cameraPhoto = await getPhoto(cameraOptions);
        const photoFileName = getPhotoFileName(userId, id);
        const base64Data = await base64FromPath(cameraPhoto.webPath!);
        await writeFile({
            path: photoFileName,
            data: base64Data,
            directory: FilesystemDirectory.Data
        });

        const photo: Photo = { userId: userId, id: id, webViewPath: cameraPhoto.webPath! };
        const statePhotos = [...photos];
        const index = statePhotos.findIndex(it => it.userId === userId && it.id === id);
        if (index === -1) {
            statePhotos.splice(0, 0, photo);
        }
        else {
            statePhotos[index] = photo;
        }

        await Storage.set({ key: environment.photo.localStorage, value: JSON.stringify(statePhotos) });
        setPhotos(statePhotos);
        return photo;
    }

    async function readPhoto(userId: number, id: number): Promise<Photo | undefined> {
        const statePhotos = [...photos];
        const index = statePhotos.findIndex(it => it.userId === userId && it.id === id);
        if (index === -1) {
            return;
        }

        return statePhotos[index];
    }

    async function removePhoto(userId: number, id: number): Promise<Photo | undefined> {
        const statePhotos = [...photos];
        const index = statePhotos.findIndex(it => it.userId === userId && it.id === id);
        if (index === -1) {
            return;
        }

        const photo = statePhotos[index];
        statePhotos.splice(index, 1);
        const photoFileName = getPhotoFileName(photo.userId, photo.id);
        await deleteFile({
            path: photoFileName,
            directory: FilesystemDirectory.Data
        });
        await Storage.set({ key: environment.photo.localStorage, value: JSON.stringify(statePhotos) });
        setPhotos(statePhotos);
    }
}
