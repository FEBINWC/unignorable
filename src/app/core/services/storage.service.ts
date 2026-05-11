import { Injectable } from '@angular/core';
import {
  Storage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface UploadProgress {
  progress: number;
  downloadUrl: string | null;
  state: 'running' | 'paused' | 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class FileStorageService {
  constructor(private storage: Storage) {}

  uploadProof(
    file: File,
    date: string,
    taskId: string
  ): Observable<UploadProgress> {
    return new Observable<UploadProgress>((observer) => {
      const path = `proofs/${date}/${taskId}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(this.storage, path);
      const uploadTask: UploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({
            progress,
            downloadUrl: null,
            state:
              snapshot.state === 'running'
                ? 'running'
                : snapshot.state === 'paused'
                ? 'paused'
                : 'running',
          });
        },
        (error) => {
          observer.next({ progress: 0, downloadUrl: null, state: 'error' });
          observer.error(error);
        },
        async () => {
          const url = await getDownloadURL(fileRef);
          observer.next({ progress: 100, downloadUrl: url, state: 'success' });
          observer.complete();
        }
      );
    });
  }
}
