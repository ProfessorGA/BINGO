import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService } from '../../services/support.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  requests: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private supportService: SupportService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.supportService.getRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load support requests. Token may be expired.';
        this.isLoading = false;
        if (err.status === 401) {
          this.logout();
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
