import { db, firebase } from '@/firebase/firebase';

export interface GameState {
  board: { [key: string]: any }; // Objeto plano para Firestore
  currentPlayer: 'white' | 'black';
  capturedPieces: { white: number; black: number };
  gameOver: boolean;
  winner: 'white' | 'black' | null;
  lastMove: number;
}

// Converte board 2D para objeto plano { "0-0": piece, "0-1": null, ... }
export function flattenBoard(board: any[][]): { [key: string]: any } {
  const flat: { [key: string]: any } = {};
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      flat[key] = cell ? { ...cell } : null;
    });
  });
  return flat;
}

// Converte objeto plano de volta para array 2D
export function unflattenBoard(flat: { [key: string]: any }): any[][] {
  const board: any[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  Object.keys(flat).forEach(key => {
    const [row, col] = key.split('-').map(Number);
    board[row][col] = flat[key];
  });
  return board;
}

export async function saveGameState(tableId: string, gameState: Partial<GameState>) {
  const stateToSave = {
    ...gameState,
    lastMove: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  await db.collection('tables').doc(tableId).collection('game').doc('state').set(stateToSave);
}

export async function getGameState(tableId: string): Promise<GameState | null> {
  const doc = await db.collection('tables').doc(tableId).collection('game').doc('state').get();
  if (!doc.exists) return null;
  
  const data = doc.data()!;
  return {
    board: data.board || {},
    currentPlayer: data.currentPlayer || 'white',
    capturedPieces: data.capturedPieces || { white: 0, black: 0 },
    gameOver: data.gameOver || false,
    winner: data.winner || null,
    lastMove: data.lastMove?.toMillis?.() || Date.now()
  };
}

export function listenGameState(tableId: string, onUpdate: (state: GameState) => void) {
  return db.collection('tables').doc(tableId).collection('game').doc('state')
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data()!;
        onUpdate({
          board: data.board || {},
          currentPlayer: data.currentPlayer || 'white',
          capturedPieces: data.capturedPieces || { white: 0, black: 0 },
          gameOver: data.gameOver || false,
          winner: data.winner || null,
          lastMove: data.lastMove?.toMillis?.() || Date.now()
        });
      }
    });
}

export async function finalizeGame(tableId: string, winner: 'white' | 'black') {
  await db.collection('tables').doc(tableId).update({
    status: 'finished',
    winner,
    finishedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}