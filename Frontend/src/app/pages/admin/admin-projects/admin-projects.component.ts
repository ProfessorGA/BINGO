import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page-container">
      <h2>Projects Management (CRUD)</h2>
      <p class="text-secondary">Create, Read, Update, and Delete your portfolio projects.</p>
      <div class="glass-panel" style="padding: 20px; margin-top: 20px;">
        <button class="btn-primary" style="margin-bottom: 20px;">+ Add New Project</button>
        <p>Data table coming soon...</p>
      </div>
    </div>
  `
})
export class AdminProjectsComponent {}
