import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-future-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page-container">
      <h2>Future Plans Management</h2>
      <p class="text-secondary">Add and track your goals and upcoming plans.</p>
      <div class="glass-panel" style="padding: 20px; margin-top: 20px;">
        <button class="btn-primary" style="margin-bottom: 20px;">+ Add Goal</button>
        <p>List coming soon...</p>
      </div>
    </div>
  `
})
export class AdminFuturePlansComponent {}
