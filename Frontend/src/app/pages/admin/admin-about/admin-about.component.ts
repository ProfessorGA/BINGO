import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AboutService, AboutContent } from '../../../services/about.service';

@Component({
  selector: 'app-admin-about',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-about.component.html',
  styleUrls: ['./admin-about.component.scss']
})
export class AdminAboutComponent implements OnInit {
  aboutContent: AboutContent | null = null;
  
  // Modal State
  isModalOpen = false;
  newAbout: AboutContent = { header: '', description: '' };

  constructor(private aboutService: AboutService) {}

  ngOnInit() {
    this.loadAboutContent();
  }

  loadAboutContent() {
    this.aboutService.getAboutContent().subscribe({
      next: (data) => {
        this.aboutContent = data;
      },
      error: () => {
        // If none exists, create an empty one for the form
        this.aboutContent = { header: '', description: '' };
      }
    });
  }

  updateAbout() {
    if (this.aboutContent) {
      this.aboutService.updateAboutContent(this.aboutContent).subscribe(() => {
        alert('Public About Page updated successfully!');
      });
    }
  }

  openModal() {
    this.isModalOpen = true;
    if (this.aboutContent) {
        // Pre-fill modal with current content for easy editing/overwriting
        this.newAbout = { header: this.aboutContent.header, description: this.aboutContent.description };
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.clearForm();
  }

  clearForm() {
    this.newAbout = { header: '', description: '' };
  }

  saveNewAbout() {
    if (this.newAbout.header && this.newAbout.description) {
      this.aboutService.updateAboutContent(this.newAbout).subscribe(() => {
        alert('New About Page created successfully!');
        this.closeModal();
        this.loadAboutContent();
      });
    } else {
      alert('Please fill out both the header and description fields.');
    }
  }
}
