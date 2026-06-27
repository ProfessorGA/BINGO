import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalrService } from '../../services/signalr.service';
import { RoomService } from '../../services/room.service';
import { GameRoom, Player, Cell } from '../../shared/models/game.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  roomCode: string = '';
  playerId: string = '';
  playerName: string = '';
  
  room: GameRoom | null = null;
  me: Player | null = null;
  opponents: Player[] = [];

  isLoading: boolean = true;
  loadingMessage: string = 'Connecting to room...';
  errorMessage: string = '';
  
  // Board setup state (1 to 25 placement)
  boardNumbers: number[] = Array(25).fill(0);
  nextNumberToPlace: number = 1;
  isReadyClicked: boolean = false;

  // Active game play error
  gameErrorMessage: string = '';

  // Disconnection timer state
  isOpponentDisconnected: boolean = false;
  disconnectedOpponentName: string = '';
  disconnectCountdown: number = 30;
  private disconnectInterval: any;

  // Confetti particles for winner screen
  confettiParticles: any[] = [];
  private confettiInterval: any;

  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signalrService: SignalrService,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    const codeParam = this.route.snapshot.paramMap.get('roomCode');
    if (!codeParam) {
      this.router.navigate(['/']);
      return;
    }
    this.roomCode = codeParam.toUpperCase();

    // Check if player details are in sessionStorage
    const storedPlayerId = sessionStorage.getItem('playerId');
    const storedRoomCode = sessionStorage.getItem('roomCode');
    const storedPlayerName = sessionStorage.getItem('playerName');

    if (storedPlayerId && storedRoomCode === this.roomCode && storedPlayerName) {
      this.playerId = storedPlayerId;
      this.playerName = storedPlayerName;
      this.initializeGame();
    } else {
      // Re-direct to join screen since player is not registered for this room in session
      this.router.navigate(['/join', this.roomCode]);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.signalrService.disconnect();
    this.clearDisconnectTimer();
    this.clearConfetti();
  }

  private initializeGame() {
    // 1. Fetch current room details to verify status
    this.roomService.getRoom(this.roomCode).subscribe({
      next: (room) => {
        this.updateRoomState(room);
        
        // 2. Connect to SignalR hub
        this.signalrService.startConnection(this.roomCode, this.playerId)
          .then(() => {
            this.isLoading = false;
            this.setupSignalRListeners();
          })
          .catch(err => {
            this.isLoading = false;
            this.errorMessage = 'Failed to connect to game hub. Refresh to try again.';
          });
      },
      error: (err) => {
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  private setupSignalRListeners() {
    // Update room board updates
    this.subs.add(
      this.signalrService.roomUpdated$.subscribe(room => {
        this.updateRoomState(room);
      })
    );

    // Start game trigger
    this.subs.add(
      this.signalrService.gameStarted$.subscribe(room => {
        this.updateRoomState(room);
        this.gameErrorMessage = '';
      })
    );

    // Setup new round trigger (re-setup board)
    this.subs.add(
      this.signalrService.gameSetupStarted$.subscribe(room => {
        this.isReadyClicked = false;
        this.boardNumbers = Array(25).fill(0);
        this.nextNumberToPlace = 1;
        this.updateRoomState(room);
        this.clearConfetti();
        this.gameErrorMessage = '';
      })
    );

    // Handle number marked alert
    this.subs.add(
      this.signalrService.numberReceived$.subscribe(num => {
        this.gameErrorMessage = '';
      })
    );

    // Handle game win
    this.subs.add(
      this.signalrService.winnerDeclared$.subscribe(room => {
        this.updateRoomState(room);
        if (room.winnerId === this.playerId) {
          this.triggerConfetti();
        }
      })
    );

    // Handle opponent disconnect
    this.subs.add(
      this.signalrService.opponentDisconnected$.subscribe(disPlayerId => {
        if (disPlayerId !== this.playerId) {
          const opponentName = this.room?.players.find(p => p.playerId === disPlayerId)?.name || 'Opponent';
          // Check if total connected players is less than 2
          const connectedCount = this.room?.players.filter(p => p.isConnected && p.playerId !== disPlayerId).length || 0;
          const totalActive = connectedCount + (this.me?.isConnected ? 1 : 0);
          if (totalActive < 2) {
            this.startDisconnectTimer(opponentName);
          }
        }
      })
    );

    // Handle opponent reconnect
    this.subs.add(
      this.signalrService.opponentReconnected$.subscribe(recPlayerId => {
        if (recPlayerId !== this.playerId) {
          this.clearDisconnectTimer();
        }
      })
    );

    // Handle room closed
    this.subs.add(
      this.signalrService.roomClosed$.subscribe(() => {
        this.clearDisconnectTimer();
        this.errorMessage = 'Active connection closed. Moving back to home...';
        setTimeout(() => this.router.navigate(['/']), 4000);
      })
    );

    // Handle validation errors from Hub
    this.subs.add(
      this.signalrService.errorOccurred$.subscribe(err => {
        this.gameErrorMessage = err;
      })
    );
  }

  private updateRoomState(room: GameRoom) {
    this.room = room;
    
    // Assign me and opponents roles
    this.me = room.players.find(p => p.playerId === this.playerId) || null;
    this.opponents = room.players.filter(p => p.playerId !== this.playerId);

    // Check reconnection timer needs to be cleared if opponents are connected
    if (this.opponents.every(o => o.isConnected)) {
      this.clearDisconnectTimer();
    }

    // Sync ready clicked state if page refreshed
    if (this.me?.isReady) {
      this.isReadyClicked = true;
    }
  }

  // Board setup methods
  placeNumber(index: number) {
    if (this.room?.state !== 'SelectingNumbers') return;
    if (this.isReadyClicked) return;
    if (this.boardNumbers[index] !== 0) return; // Already placed

    this.boardNumbers[index] = this.nextNumberToPlace;
    this.nextNumberToPlace++;
  }

  clearBoard() {
    if (this.isReadyClicked) return;
    this.boardNumbers = Array(25).fill(0);
    this.nextNumberToPlace = 1;
  }

  submitReady() {
    if (this.nextNumberToPlace <= 25) {
      this.gameErrorMessage = 'Please place all 25 numbers on the board first.';
      return;
    }

    this.isReadyClicked = true;
    this.signalrService.sendReady(this.boardNumbers).catch(err => {
      this.isReadyClicked = false;
      this.gameErrorMessage = 'Failed to submit board settings.';
    });
  }

  // Gameplay methods
  onCellClick(cell: Cell) {
    if (this.room?.state !== 'Playing') return;
    if (!this.isMyTurn()) return;
    if (cell.isMarked) return;

    this.gameErrorMessage = '';
    this.signalrService.submitNumber(cell.number).catch(err => {
      this.gameErrorMessage = 'Failed to submit number.';
    });
  }

  startSetup() {
    this.gameErrorMessage = '';
    this.signalrService.startSetup().catch(err => {
      this.gameErrorMessage = err || 'Failed to start setup.';
    });
  }

  playAgain() {
    this.signalrService.requestPlayAgain().catch(err => {
      this.gameErrorMessage = 'Failed to send Play Again request.';
    });
  }

  returnHome() {
    // Fire leave room and navigate home
    this.roomService.leaveRoom(this.roomCode, this.playerId).subscribe({
      next: () => {
        sessionStorage.clear();
        this.router.navigate(['/']);
      },
      error: () => {
        sessionStorage.clear();
        this.router.navigate(['/']);
      }
    });
  }

  private copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          return Promise.resolve();
        } else {
          return Promise.reject(new Error('Fallback copy failed'));
        }
      } catch (err) {
        document.body.removeChild(textArea);
        return Promise.reject(err);
      }
    }
  }

  copyRoomCode() {
    this.copyToClipboard(this.roomCode)
      .then(() => alert(`Room Code copied to clipboard: ${this.roomCode}`))
      .catch(err => {
        console.error('Failed to copy:', err);
        alert(`Could not copy automatically. The room code is: ${this.roomCode}`);
      });
  }

  copyShareUrl() {
    const shareUrl = `${window.location.origin}/join/${this.roomCode}`;
    this.copyToClipboard(shareUrl)
      .then(() => alert(`Shareable link copied to clipboard!`))
      .catch(err => {
        console.error('Failed to copy:', err);
        alert(`Could not copy automatically. The share link is: ${shareUrl}`);
      });
  }

  // Turn helper
  isMyTurn(): boolean {
    return this.room?.state === 'Playing' && this.room.currentTurnPlayerId === this.playerId;
  }

  // Letter completing checking helpers
  isPlayerLetterCompleted(player: Player | null, letterIndex: number): boolean {
    // 0: B, 1: I, 2: N, 3: G, 4: O
    const completedLines = player?.board?.completedLinesCount || 0;
    return completedLines > letterIndex;
  }

  getTurnPlayerName(): string {
    const activeRoom = this.room;
    if (!activeRoom || !activeRoom.currentTurnPlayerId) return '';
    const player = activeRoom.players.find(p => p.playerId === activeRoom.currentTurnPlayerId);
    return player ? player.name : '';
  }

  getWinnerName(): string {
    const activeRoom = this.room;
    if (!activeRoom || !activeRoom.winnerId) return '';
    const player = activeRoom.players.find(p => p.playerId === activeRoom.winnerId);
    return player ? player.name : '';
  }

  // Timer routines
  private startDisconnectTimer(name: string) {
    this.clearDisconnectTimer();
    this.isOpponentDisconnected = true;
    this.disconnectedOpponentName = name;
    this.disconnectCountdown = 30;

    this.disconnectInterval = setInterval(() => {
      this.disconnectCountdown--;
      if (this.disconnectCountdown <= 0) {
        this.clearDisconnectTimer();
        this.errorMessage = 'Active players left or connection timed out.';
        setTimeout(() => this.router.navigate(['/']), 3000);
      }
    }, 1000);
  }

  private clearDisconnectTimer() {
    this.isOpponentDisconnected = false;
    if (this.disconnectInterval) {
      clearInterval(this.disconnectInterval);
      this.disconnectInterval = null;
    }
  }

  // Particles generator for winning screen
  triggerConfetti() {
    this.clearConfetti();
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
    this.confettiInterval = setInterval(() => {
      this.confettiParticles.push({
        x: Math.random() * 100, // percentage width
        y: -10, // top
        size: Math.random() * 8 + 5, // size px
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speedY: Math.random() * 4 + 2,
        speedX: Math.random() * 2 - 1
      });
      // limit max particles
      if (this.confettiParticles.length > 100) {
        this.confettiParticles.shift();
      }
    }, 100);

    // Animate them
    const animFrame = () => {
      this.confettiParticles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += 2;
      });
      this.confettiParticles = this.confettiParticles.filter(p => p.y < 110);
      if (this.confettiInterval) {
        requestAnimationFrame(animFrame);
      }
    };
    requestAnimationFrame(animFrame);
  }

  private clearConfetti() {
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
      this.confettiInterval = null;
    }
    this.confettiParticles = [];
  }
}
