import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-join-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-code.component.html',
  styleUrl: './join-code.component.scss'
})
export class JoinCodeComponent implements OnInit {
  roomCode: string = '';
  playerName: string = '';
  
  isLoading: boolean = true;
  errorMessage: string = '';
  isJoining: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    const codeParam = this.route.snapshot.paramMap.get('roomCode');
    if (!codeParam) {
      this.router.navigate(['/']);
      return;
    }
    this.roomCode = codeParam.toUpperCase();

    // Verify if the room is active and open to join
    this.roomService.getRoom(this.roomCode).subscribe({
      next: (room) => {
        this.isLoading = false;
        if (room.state !== 'Waiting') {
          this.errorMessage = room.state === 'Finished' 
            ? 'This match has already finished.' 
            : 'This room is currently playing a match or is full.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Room code does not exist or has expired.';
      }
    });
  }

  onJoin() {
    if (!this.playerName.trim()) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    this.isJoining = true;
    this.errorMessage = '';

    this.roomService.joinRoom(this.roomCode, this.playerName.trim()).subscribe({
      next: (res) => {
        sessionStorage.setItem('playerId', res.playerId);
        sessionStorage.setItem('roomCode', res.room.roomCode);
        sessionStorage.setItem('playerName', this.playerName.trim());

        this.router.navigate(['/game', this.roomCode]);
      },
      error: (err) => {
        this.isJoining = false;
        this.errorMessage = err.error?.error || 'Failed to join the match. The room might be full or closed.';
      }
    });
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
