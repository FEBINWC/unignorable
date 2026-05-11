import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FileStorageService, UploadProgress } from '../../../core/services/storage.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div
      class="upload-area"
      (drop)="onDrop($event)"
      (dragover)="onDragOver($event)"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        (change)="onFileSelected($event)"
        accept="image/*,.pdf,.doc,.docx"
        hidden
        multiple
      />

      @if (!uploading) {
        <mat-icon>cloud_upload</mat-icon>
        <span>Drop files or click to upload</span>
      } @else {
        <mat-progress-bar mode="determinate" [value]="progress"></mat-progress-bar>
        <span>Uploading... {{ progress | number: '1.0-0' }}%</span>
      }
    </div>
  `,
  styles: [
    `
      .upload-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 24px;
        border: 2px dashed #bdbdbd;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.2s;
        color: #757575;
      }
      .upload-area:hover {
        border-color: #1976d2;
        color: #1976d2;
      }
      mat-progress-bar {
        width: 100%;
      }
    `,
  ],
})
export class FileUploadComponent {
  @Input() date = '';
  @Input() taskId = '';
  @Output() uploaded = new EventEmitter<string>();

  private storageService = inject(FileStorageService);

  uploading = false;
  progress = 0;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) this.uploadFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.uploadFiles(input.files);
  }

  private uploadFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      this.uploadFile(files[i]);
    }
  }

  private uploadFile(file: File): void {
    this.uploading = true;
    this.storageService
      .uploadProof(file, this.date, this.taskId)
      .subscribe({
        next: (p: UploadProgress) => {
          this.progress = p.progress;
          if (p.state === 'success' && p.downloadUrl) {
            this.uploaded.emit(p.downloadUrl);
            this.uploading = false;
            this.progress = 0;
          }
        },
        error: () => {
          this.uploading = false;
          this.progress = 0;
        },
      });
  }
}
