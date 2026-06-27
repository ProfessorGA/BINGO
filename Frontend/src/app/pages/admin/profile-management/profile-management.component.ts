import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService, AdminUser } from '../../../services/admin-user.service';

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-management.component.html',
  styleUrls: ['./profile-management.component.scss']
})
export class ProfileManagementComponent implements OnInit {
  users: AdminUser[] = [];
  currentUser: AdminUser | null = null;
  
  // Modal State
  isModalOpen = false;
  newUser: AdminUser = { username: '', passwordHash: '' };

  constructor(private adminUserService: AdminUserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminUserService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        if (this.users.length > 0) {
          this.currentUser = { ...this.users[0] };
        }
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        // Provide a dummy fallback so the UI isn't completely broken if the backend is down during testing
        this.currentUser = { username: 'Admin (Offline Mode)', passwordHash: '********' };
      }
    });
  }

  updateCurrentUser() {
    if (this.currentUser && this.currentUser.id) {
      this.adminUserService.updateUser(this.currentUser.id, this.currentUser).subscribe(() => {
        alert('Profile updated successfully!');
        this.loadUsers();
      });
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.clearForm();
  }

  clearForm() {
    this.newUser = { username: '', passwordHash: '' };
  }

  saveNewUser() {
    if (this.newUser.username && this.newUser.passwordHash) {
      this.adminUserService.createUser(this.newUser).subscribe(() => {
        alert('New admin user created successfully!');
        this.closeModal();
        this.loadUsers();
      });
    } else {
      alert('Please fill out both fields.');
    }
  }
}
