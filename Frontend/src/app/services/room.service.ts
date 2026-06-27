import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameRoom } from '../shared/models/game.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  // Configured local backend port as discovered in launchSettings
  private baseUrl = 'http://localhost:5035';

  constructor(private http: HttpClient) {
    if (window.location.hostname !== 'localhost') {
      // Fallback production URL (Render backend). Change this to your deployed Render URL.
      this.baseUrl = 'https://bingo-uwyr.onrender.com';
    }
  }

  createRoom(hostName: string): Observable<{ room: GameRoom, playerId: string }> {
    return this.http.post<{ room: GameRoom, playerId: string }>(`${this.baseUrl}/room/create`, { hostName });
  }

  joinRoom(roomCode: string, playerName: string): Observable<{ room: GameRoom, playerId: string }> {
    return this.http.post<{ room: GameRoom, playerId: string }>(`${this.baseUrl}/room/join`, { roomCode, playerName });
  }

  getRoom(roomCode: string): Observable<GameRoom> {
    return this.http.get<GameRoom>(`${this.baseUrl}/room/${roomCode}`);
  }

  leaveRoom(roomCode: string, playerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/room/leave`, { roomCode, playerId });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
