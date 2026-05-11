import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FileStorageService, UploadProgress } from '../../../core/services/storage.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div
      class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-500 transition-colors hover:border-primary hover:text-primary"
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
        <i class="mdi mdi-cloud-upload text-3xl"></i>
        <span class="text-sm">Drop files or click to upload</span>
      } @else {
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div class="h-full rounded-full bg-primary transition-all" [style.width.%]="progress"></div>
        </div>
        <span class="text-sm">Uploading... {{ progress | number: '1.0-0' }}%</span>
      }
    </div>
  `,
})
export class FileUploadComponent {
  @Input() date = '';
  @Input() taskId = '';
  @Output() uploaded = new EventEmitter<string>();

  private storageService = inject(FileStorageService);
  uploading = false;
  progress = 0;

  onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); }

  onDrop(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    if (event.dataTransfer?.files) this.uploadFiles(event.dataTransfer.files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.uploadFiles(input.files);
  }

  private uploadFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) this.uploadFile(files[i]);
  }

  private uploadFile(file: File): void {
    this.uploading = true;
    this.storageService.uploadProof(file, this.date, this.taskId).subscribe({
      next: (p: UploadProgress) => {
        this.progress = p.progress;
        if (p.state === 'success' && p.downloadUrl) {
          this.uploaded.emit(p.downloadUrl);
          this.uploading = false;
          this.progress = 0;
        }
      },
      error: () => { this.uploading = false; this.progress = 0; },
    });
  }
}
