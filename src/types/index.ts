export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  age: number;
  isOnline?: boolean;
  lastActivity?: any;
  createdAt?: any;
}

export interface Table {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostCity: string;
  type: 'free' | 'bet';
  stake?: number;
  status: 'waiting' | 'playing' | 'finished';
  opponentId?: string;
  opponentName?: string;
  createdAt: any;
  gameId?: string;
}

export type PieceType = 'normal' | 'king';
export type PlayerColor = 'red' | 'black';

export interface Piece {
  id: string;
  color: PlayerColor;
  type: PieceType;
  row: number;
  col: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position;
  timestamp?: any;
}

export interface GameState {
  id: string;
  tableId: string;
  redPlayerId: string;
  blackPlayerId: string;
  redPlayerName: string;
  blackPlayerName: string;
  currentTurn: PlayerColor;
  pieces: Piece[];
  status: 'waiting' | 'playing' | 'finished';
  winner?: PlayerColor;
  moves: Move[];
  createdAt: any;
  updatedAt: any;
  mustCapturePieceId?: string;
}

export interface GameContextType {
  user: User | null;
  tables: Table[];
  currentGame: GameState | null;
  onlineUsers: User[];
  loading: boolean;
  isMinimized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, city: string, age: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createTable: (name: string, type: 'free' | 'bet', stake?: number) => Promise<string>;
  joinTable: (tableId: string) => Promise<void>;
  leaveTable: (tableId: string) => Promise<void>;
  cancelTable: (tableId: string) => Promise<void>;
  startGame: (tableId: string) => Promise<void>;
  makeMove: (move: Move, newPieces: Piece[], newTurn: PlayerColor, winner?: PlayerColor) => Promise<void>;
  resignGame: () => Promise<void>;
  toggleMinimize: () => void;
  getMyActiveTable: () => Table | undefined;
  isMyTurn: () => boolean;
  getPlayerColor: () => PlayerColor | null;
}
