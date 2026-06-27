export interface Cell {
  number: number;
  isMarked: boolean;
  row: number;
  col: number;
}

export interface Board {
  cells: Cell[];
  completedLinesCount: number;
}

export interface Player {
  playerId: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  board: Board;
  isConnected: boolean;
  playAgainRequested: boolean;
  numbersPlaced: number;
  isIdle: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestampIso: string;
  seenBy: string[];
}

export interface GameRoom {
  roomCode: string;
  state: 'Waiting' | 'SelectingNumbers' | 'Playing' | 'Finished';
  selectedNumbers: number[];
  winnerId: string | null;
  currentTurnPlayerId: string | null;
  players: Player[];
  chatMessages: ChatMessage[];
}
