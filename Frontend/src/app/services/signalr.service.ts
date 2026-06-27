import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { GameRoom } from '../shared/models/game.model';
import { RoomService } from './room.service';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;
  private roomCode: string = '';
  private playerId: string = '';

  private roomUpdated = new Subject<GameRoom>();
  public roomUpdated$ = this.roomUpdated.asObservable();

  private gameStarted = new Subject<GameRoom>();
  public gameStarted$ = this.gameStarted.asObservable();

  private gameSetupStarted = new Subject<GameRoom>();
  public gameSetupStarted$ = this.gameSetupStarted.asObservable();

  private numberReceived = new Subject<number>();
  public numberReceived$ = this.numberReceived.asObservable();

  private winnerDeclared = new Subject<GameRoom>();
  public winnerDeclared$ = this.winnerDeclared.asObservable();

  private opponentDisconnected = new Subject<string>();
  public opponentDisconnected$ = this.opponentDisconnected.asObservable();

  private opponentReconnected = new Subject<string>();
  public opponentReconnected$ = this.opponentReconnected.asObservable();

  private roomClosed = new Subject<void>();
  public roomClosed$ = this.roomClosed.asObservable();

  private errorOccurred = new Subject<string>();
  public errorOccurred$ = this.errorOccurred.asObservable();
  
  private chatMessageReceived = new Subject<any>();
  public chatMessageReceived$ = this.chatMessageReceived.asObservable();

  private setupProgressUpdated = new Subject<{ playerId: string, count: number }>();
  public setupProgressUpdated$ = this.setupProgressUpdated.asObservable();

  private kicked = new Subject<void>();
  public kicked$ = this.kicked.asObservable();

  constructor(private roomService: RoomService) {}

  public startConnection(roomCode: string, playerId: string): Promise<void> {
    this.roomCode = roomCode;
    this.playerId = playerId;

    const hubUrl = `${this.roomService.getBaseUrl()}/hubs/bingo`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.registerOnEvents();

    return this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection established.');
        return this.joinRoomHub();
      })
      .catch(err => {
        console.error('Error starting SignalR connection:', err);
        throw err;
      });
  }

  private joinRoomHub(): Promise<void> {
    return this.hubConnection.invoke('JoinRoomHub', this.roomCode, this.playerId);
  }

  private registerOnEvents(): void {
    this.hubConnection.on('UpdateBoard', (room: GameRoom) => {
      this.roomUpdated.next(room);
    });

    this.hubConnection.on('StartGame', (room: GameRoom) => {
      this.gameStarted.next(room);
    });

    this.hubConnection.on('StartGameSetup', (room: GameRoom) => {
      this.gameSetupStarted.next(room);
    });

    this.hubConnection.on('ReceiveNumber', (num: number) => {
      this.numberReceived.next(num);
    });

    this.hubConnection.on('PlayerWon', (room: GameRoom) => {
      this.winnerDeclared.next(room);
    });

    this.hubConnection.on('OpponentDisconnected', (disPlayerId: string) => {
      this.opponentDisconnected.next(disPlayerId);
    });

    this.hubConnection.on('OpponentReconnected', (recPlayerId: string) => {
      this.opponentReconnected.next(recPlayerId);
    });

    this.hubConnection.on('RoomClosed', () => {
      this.roomClosed.next();
    });

    this.hubConnection.on('ValidationError', (err: string) => {
      this.errorOccurred.next(err);
    });

    this.hubConnection.on('Error', (err: string) => {
      this.errorOccurred.next(err);
    });

    this.hubConnection.on('ReceiveChatMessage', (message: any) => {
      this.chatMessageReceived.next(message);
    });

    this.hubConnection.on('SetupProgressUpdated', (playerId: string, count: number) => {
      this.setupProgressUpdated.next({ playerId, count });
    });

    this.hubConnection.on('Kicked', () => {
      this.kicked.next();
    });

    // Handle auto reconnection
    this.hubConnection.onreconnected(connectionId => {
      console.log('SignalR reconnected. ConnectionId:', connectionId);
      this.joinRoomHub().catch(err => console.error('Error re-joining hub after reconnection:', err));
    });
  }

  public startSetup(): Promise<void> {
    return this.hubConnection.invoke('StartSetup', this.roomCode, this.playerId);
  }

  public sendReady(numbers: number[]): Promise<void> {
    return this.hubConnection.invoke('PlayerReady', this.roomCode, this.playerId, numbers);
  }

  public submitNumber(number: number): Promise<void> {
    return this.hubConnection.invoke('SubmitNumber', this.roomCode, this.playerId, number);
  }

  public requestPlayAgain(): Promise<void> {
    return this.hubConnection.invoke('PlayAgain', this.roomCode, this.playerId);
  }

  public sendChatMessage(text: string): Promise<void> {
    return this.hubConnection.invoke('SendChatMessage', this.roomCode, this.playerId, text);
  }

  public markMessagesAsRead(): Promise<void> {
    return this.hubConnection.invoke('MarkMessagesAsRead', this.roomCode, this.playerId);
  }

  public updateSetupProgress(count: number): Promise<void> {
    return this.hubConnection.invoke('UpdateSetupProgress', this.roomCode, this.playerId, count);
  }

  public kickPlayer(targetPlayerId: string): Promise<void> {
    return this.hubConnection.invoke('KickPlayer', this.roomCode, this.playerId, targetPlayerId);
  }

  public sendHeartbeat(): Promise<void> {
    return this.hubConnection.invoke('SendHeartbeat', this.roomCode, this.playerId);
  }

  public disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
