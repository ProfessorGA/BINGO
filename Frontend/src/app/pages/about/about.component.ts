import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutService, AboutContent } from '../../services/about.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  aboutContent: AboutContent | null = null;
  isLoading = true;

  constructor(private aboutService: AboutService) {}

  ngOnInit() {
    this.aboutService.getAboutContent().subscribe({
      next: (data) => {
        this.aboutContent = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
