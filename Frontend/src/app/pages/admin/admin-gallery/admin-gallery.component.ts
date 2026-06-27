import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page-container">
      <h2>Gallery Management</h2>
      <p class="text-secondary">Upload and manage images for your gallery.</p>
      <div class="glass-panel" style="padding: 20px; margin-top: 20px;">
        <button class="btn-primary" style="margin-bottom: 20px;">+ Upload Image</button>
        <p>Grid view coming soon...</p>
      </div>
    </div>
  `
})
export class AdminGalleryComponent {}
