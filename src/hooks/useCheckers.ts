import { useState, useCallback, useEffect } from 'react';
import { GameState, Piece, Position, PlayerColor, Move } from '@/types';

const BOARD_SIZE = 8;

// Criar peças iniciais
const createInitialPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  let idCounter = 0;

  // Peças pretas (topo)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `black-${idCounter++}`,
          color: 'black',
          type: 'normal',
          row,
          col
        });
      }
    }
  }

  // Peças vermelhas (base)
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `red-${idCounter++}`,
          color: 'red',
          type: 'normal',
          row,
          col
        });
      }
    }
  }

  return pieces;
};

// Verificar se posição está dentro do tabuleiro
const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

// Verificar se há peça em uma posição
const getPieceAt = (pieces: Piece[], row: number, col: number): Piece | undefined => {
  return pieces.find(p => p.row === row && p.col === col);
};

// Verificar movimentos válidos para uma peça
const getValidMoves = (
  pieces: Piece[],
  piece: Piece,
  mustCaptureOnly: boolean = false
): { to: Position; captured?: Position }[] => {
  const moves: { to: Position; captured?: Position }[] = [];
  const captures: { to: Position; captured: Position }[] = [];

  const directions = piece.type === 'king' 
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === 'black'
      ? [[1, -1], [1, 1]]
      : [[-1, -1], [-1, 1]];

  for (const [dRow, dCol] of directions) {
    const newRow = piece.row + dRow;
    const newCol = piece.col + dCol;

    if (isValidPosition(newRow, newCol)) {
      const targetPiece = getPieceAt(pieces, newRow, newCol);

      if (!targetPiece && !mustCaptureOnly) {
        moves.push({ to: { row: newRow, col: newCol } });
      } else if (targetPiece && targetPiece.color !== piece.color) {
        const jumpRow = newRow + dRow;
        const jumpCol = newCol + dCol;

        if (isValidPosition(jumpRow, jumpCol) && !getPieceAt(pieces, jumpRow, jumpCol)) {
          captures.push({ 
            to: { row: jumpRow, col: jumpCol }, 
            captured: { row: newRow, col: newCol } 
          });
        }
      }
    }
  }

  return captures.length > 0 ? captures : moves;
};

// Verificar se há capturas obrigatórias para o jogador atual
const getMandatoryCaptures = (pieces: Piece[], color: PlayerColor): Piece[] => {
  return pieces
    .filter(p => p.color === color)
    .filter(p => {
      const moves = getValidMoves(pieces, p);
      return moves.some(m => m.captured !== undefined);
    });
};

// Verificar vencedor
const checkWinner = (pieces: Piece[], currentTurn: PlayerColor): PlayerColor | undefined => {
  const redPieces = pieces.filter(p => p.color === 'red');
  const blackPieces = pieces.filter(p => p.color === 'black');

  if (redPieces.length === 0) return 'black';
  if (blackPieces.length === 0) return 'red';

  // Verificar se o jogador atual tem movimentos válidos
  const currentPieces = pieces.filter(p => p.color === currentTurn);
  const hasValidMoves = currentPieces.some(p => {
    const moves = getValidMoves(pieces, p);
    return moves.length > 0;
  });

  if (!hasValidMoves) {
    return currentTurn === 'red' ? 'black' : 'red';
  }

  return undefined;
};

// Verificar promoção
const checkPromotion = (piece: Piece): boolean => {
  if (piece.type === 'king') return false;
  return (piece.color === 'black' && piece.row === 7) ||
         (piece.color === 'red' && piece.row === 0);
};

export function useCheckers(gameState: GameState | null, onMove: (move: Move, newPieces: Piece[], newTurn: PlayerColor, winner?: PlayerColor) => void) {
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<{ to: Position; captured?: Position }[]>([]);
  const [mandatoryPieces, setMandatoryPieces] = useState<Piece[]>([]);

  // Atualizar capturas obrigatórias quando o turno muda
  useEffect(() => {
    if (gameState && gameState.status === 'playing') {
      const mandatory = getMandatoryCaptures(gameState.pieces, gameState.currentTurn);
      setMandatoryPieces(mandatory);
    }
  }, [gameState?.currentTurn, gameState?.pieces, gameState?.status]);

  const selectPiece = useCallback((piece: Piece | null) => {
    if (!piece || !gameState) {
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    // Verificar se é a vez do jogador
    if (piece.color !== gameState.currentTurn) {
      return;
    }

    // Se há capturas obrigatórias, só pode selecionar peças que podem capturar
    const mustCapture = getMandatoryCaptures(gameState.pieces, gameState.currentTurn);
    if (mustCapture.length > 0 && !mustCapture.find(p => p.id === piece.id)) {
      return;
    }

    setSelectedPiece(piece);
    const moves = getValidMoves(gameState.pieces, piece, mustCapture.length > 0);
    setValidMoves(moves);
  }, [gameState]);

  const movePiece = useCallback((to: Position) => {
    if (!selectedPiece || !gameState) return;

    const move = validMoves.find(m => m.to.row === to.row && m.to.col === to.col);
    if (!move) return;

    // Criar novo estado das peças
    let newPieces = gameState.pieces.map(p => {
      if (p.id === selectedPiece.id) {
        const updatedPiece = { ...p, row: to.row, col: to.col };
        if (checkPromotion(updatedPiece)) {
          updatedPiece.type = 'king';
        }
        return updatedPiece;
      }
      return p;
    });

    // Remover peça capturada
    if (move.captured) {
      newPieces = newPieces.filter(p => !(p.row === move.captured!.row && p.col === move.captured!.col));
    }

    // Verificar se há mais capturas possíveis (captura múltipla)
    const movedPiece = newPieces.find(p => p.id === selectedPiece.id)!;
    const additionalCaptures = getValidMoves(newPieces, movedPiece, true).filter(m => m.captured);

    let newTurn: PlayerColor = gameState.currentTurn;
    let winner: PlayerColor | undefined;

    if (additionalCaptures.length > 0 && move.captured) {
      // Continuar com a mesma peça
      setSelectedPiece(movedPiece);
      setValidMoves(additionalCaptures);
      newTurn = gameState.currentTurn; // Mantém o turno
    } else {
      // Trocar turno
      newTurn = gameState.currentTurn === 'red' ? 'black' : 'red';
      setSelectedPiece(null);
      setValidMoves([]);
    }

    // Verificar vencedor
    winner = checkWinner(newPieces, newTurn);

    // Criar o movimento
    const moveData: Move = {
      from: { row: selectedPiece.row, col: selectedPiece.col },
      to,
      captured: move.captured
    };

    onMove(moveData, newPieces, newTurn, winner);
  }, [selectedPiece, validMoves, gameState, onMove]);

  const isValidMove = useCallback((row: number, col: number): boolean => {
    return validMoves.some(m => m.to.row === row && m.to.col === col);
  }, [validMoves]);

  const canSelectPiece = useCallback((piece: Piece): boolean => {
    if (!gameState || gameState.status !== 'playing') return false;
    if (piece.color !== gameState.currentTurn) return false;
    
    const mustCapture = getMandatoryCaptures(gameState.pieces, gameState.currentTurn);
    if (mustCapture.length > 0) {
      return mustCapture.some(p => p.id === piece.id);
    }
    return true;
  }, [gameState]);

  return {
    selectedPiece,
    validMoves,
    mandatoryPieces,
    selectPiece,
    movePiece,
    isValidMove,
    canSelectPiece
  };
}
