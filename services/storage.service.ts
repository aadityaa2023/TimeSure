import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export type UploadProgress = (progress: number) => void;

export const uploadImage = async (
    uri: string,
    path: string,
    onProgress?: UploadProgress,
): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            error => reject(error),
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
            },
        );
    });
};

export const uploadProfileImage = async (
    uid: string,
    uri: string,
    onProgress?: UploadProgress,
): Promise<string> => {
    return uploadImage(uri, `profiles/${uid}/avatar.jpg`, onProgress);
};

export const uploadProductImage = async (
    productId: string,
    uri: string,
    index = 0,
    onProgress?: UploadProgress,
): Promise<string> => {
    return uploadImage(uri, `products/${productId}/image_${index}.jpg`, onProgress);
};

export const deleteImage = async (url: string): Promise<void> => {
    const imageRef = ref(storage, url);
    await deleteObject(imageRef);
};
