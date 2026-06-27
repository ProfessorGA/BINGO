import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  activeTab: 'create' | 'join' = 'create';
  
  hostName: string = '';
  playerName: string = '';
  roomCode: string = '';
  
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private roomService: RoomService, private router: Router) {}

  setTab(tab: 'create' | 'join') {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  onCreateRoom() {
    if (!this.hostName.trim()) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.roomService.createRoom(this.hostName.trim()).subscribe({
      next: (res) => {
        // Save playerId and roomCode in sessionStorage for session restoration
        sessionStorage.setItem('playerId', res.playerId);
        sessionStorage.setItem('roomCode', res.room.roomCode);
        sessionStorage.setItem('playerName', this.hostName.trim());
        
        this.router.navigate(['/game', res.room.roomCode]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Failed to create room. Please try again.';
      }
    });
  }

  onJoinRoom() {
    if (!this.playerName.trim()) {
      this.errorMessage = 'Please enter your name.';
      return;
    }
    if (!this.roomCode.trim() || this.roomCode.trim().length !== 4) {
      this.errorMessage = 'Room code must be exactly 4 characters.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formattedCode = this.roomCode.trim().toUpperCase();

    this.roomService.joinRoom(formattedCode, this.playerName.trim()).subscribe({
      next: (res) => {
        sessionStorage.setItem('playerId', res.playerId);
        sessionStorage.setItem('roomCode', res.room.roomCode);
        sessionStorage.setItem('playerName', this.playerName.trim());

        this.router.navigate(['/game', res.room.roomCode]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Invalid Room Code or room is full.';
      }
    });
  }
}
