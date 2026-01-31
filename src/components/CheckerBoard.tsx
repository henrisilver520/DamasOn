import { useState, useEffect, useCallback } from 'react';
import { TableDoc } from '@/types/domain';

interface CheckerBoardProps {
  table: TableDoc;
  playerColor: 'white' | 'black';
  onExit: () => void;
}

type PieceType = 'white' | 'black' | 'white-king' | 'black-king' | null;

interface Piece {
  type: PieceType;
  id: string;
}

interface Position {
  row: number;
  col: number;
}

export function CheckerBoard({ table, playerColor, onExit }: CheckerBoardProps) {
  const [board, setBoard] = useState<Piece[][]>([]);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [capturedPieces, setCapturedPieces] = useState({ white: 0, black: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [mustCapture, setMustCapture] = useState(false);

  const opponentName = playerColor === 'white' ? table.opponentName : table.createdByName;
  const myName = playerColor === 'white' ? table.createdByName : table.opponentName;

  // Initialize board
  useEffect(() => {
    const newBoard: Piece[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { type: 'black', id: `b-${row}-${col}` };
        }
      }
    }
    
    // Place white pieces (bottom)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = { type: 'white', id: `w-${row}-${col}` };
        }
      }
    }
    
    setBoard(newBoard);
  }, []);

  const isKing = (piece: PieceType) => piece === 'white-king' || piece === 'black-king';

  const getValidMoves = useCallback((row: number, col: number, boardState: Piece[][]): Position[] => {
    const piece = boardState[row][col];
    if (!piece) return [];

    const moves: Position[] = [];
    const captures: Position[] = [];
    const pieceColor = piece.type?.includes('white') ? 'white' : 'black';
    const direction = pieceColor === 'white' ? -1 : 1;

    // Regular moves
    const directions = isKing(piece.type) 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : [[direction, -1], [direction, 1]];

    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!boardState[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    // Capture moves
    const captureDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dRow, dCol] of captureDirections) {
      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;
      const midRow = row + dRow;
      const midCol = col + dCol;

      if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8) {
        const midPiece = boardState[midRow][midCol];
        const jumpPiece = boardState[jumpRow][jumpCol];

        if (midPiece && !jumpPiece) {
          const midColor = midPiece.type?.includes('white') ? 'white' : 'black';
          if (midColor !== pieceColor) {
            captures.push({ row: jumpRow, col: jumpCol });
          }
        }
      }
    }

    return captures.length > 0 ? captures : moves;
  }, []);

  // Check if any piece must capture
  useEffect(() => {
    if (!board.length) return;

    let hasCapture = false;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type?.includes(currentPlayer)) {
          const moves = getValidMoves(row, col, board);
          // Check if any move is a capture (jump)
          if (moves.some(m => Math.abs(m.row - row) === 2)) {
            hasCapture = true;
            break;
          }
        }
      }
      if (hasCapture) break;
    }
    setMustCapture(hasCapture);
  }, [board, currentPlayer, getValidMoves]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;

    const piece = board[row][col];

    // Select piece
    if (piece && piece.type?.includes(currentPlayer)) {
      setSelectedPiece({ row, col });
      setValidMoves(getValidMoves(row, col, board));
      return;
    }

    // Move piece
    if (selectedPiece && validMoves.some(m => m.row === row && m.col === col)) {
      const newBoard = board.map(r => [...r]);
      const pieceToMove = newBoard[selectedPiece.row][selectedPiece.col];
      
      // Check for capture
      const isCapture = Math.abs(row - selectedPiece.row) === 2;
      if (isCapture) {
        const midRow = (row + selectedPiece.row) / 2;
        const midCol = (col + selectedPiece.col) / 2;
        const capturedPiece = newBoard[midRow][midCol];
        newBoard[midRow][midCol] = null as any;
        
        setCapturedPieces(prev => ({
          ...prev,
          [capturedPiece?.type?.includes('white') ? 'white' : 'black']: 
            prev[capturedPiece?.type?.includes('white') ? 'white' : 'black'] + 1
        }));
      }

      // Move piece
      newBoard[row][col] = pieceToMove;
      newBoard[selectedPiece.row][selectedPiece.col] = null as any;

      // Check for king promotion
      if (pieceToMove?.type === 'white' && row === 0) {
        newBoard[row][col] = { ...pieceToMove, type: 'white-king' };
      } else if (pieceToMove?.type === 'black' && row === 7) {
        newBoard[row][col] = { ...pieceToMove, type: 'black-king' };
      }

      setBoard(newBoard);
      setSelectedPiece(null);
      setValidMoves([]);

      // Check for multi-capture
      if (isCapture) {
        const newMoves = getValidMoves(row, col, newBoard);
        const captureMoves = newMoves.filter(m => Math.abs(m.row - row) === 2);
        if (captureMoves.length > 0) {
          setSelectedPiece({ row, col });
          setValidMoves(captureMoves);
          return;
        }
      }

      // Switch player
      setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');

      // Check for game over
      checkGameOver(newBoard);
    }
  };

  const checkGameOver = (boardState: Piece[][]) => {
    let whiteCount = 0;
    let blackCount = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];
        if (piece) {
          if (piece.type?.includes('white')) whiteCount++;
          if (piece.type?.includes('black')) blackCount++;
        }
      }
    }

    if (whiteCount === 0) {
      setGameOver(true);
      setWinner('black');
    } else if (blackCount === 0) {
      setGameOver(true);
      setWinner('white');
    }
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  const isSelected = (row: number, col: number) => {
    return selectedPiece?.row === row && selectedPiece?.col === col;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex flex-col">
      {/* Header */}
      <header className="bg-amber-950/50 border-b border-amber-600/30 backdrop-blur-lg px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 text-amber-200 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Sair
            </button>
            <div>
              <h1 className="text-lg font-bold text-amber-100">Partida em Andamento</h1>
              <p className="text-sm text-amber-400">
                {table.kind === 'bet' ? `Aposta: ${table.betAmount} fichas` : 'Partida amistosa'}
              </p>
            </div>
          </div>
          
          {gameOver && (
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <span className="text-green-300 font-bold">
                {winner === playerColor ? 'Você venceu!' : 'Você perdeu!'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Player Info - Left */}
          <div className="order-2 lg:order-1 bg-amber-800/30 backdrop-blur-sm rounded-2xl border border-amber-600/20 p-6 min-w-[200px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-amber-950 font-bold text-2xl mb-3">
                {opponentName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="font-semibold text-amber-100">{opponentName || 'Aguardando...'}</div>
              <div className="text-sm text-amber-400">Oponente</div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full bg-stone-800 border-2 border-stone-600" />
                <span className="text-amber-300">{capturedPieces.black} capturadas</span>
              </div>
            </div>
          </div>

          {/* Board */}
          <div className="order-1 lg:order-2">
            {/* Turn Indicator */}
            <div className="mb-4 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                currentPlayer === playerColor 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <div className={`w-3 h-3 rounded-full ${currentPlayer === 'white' ? 'bg-amber-100' : 'bg-stone-800'}`} />
                <span className="font-medium">
                  {currentPlayer === playerColor ? 'Sua vez!' : 'Vez do oponente'}
                </span>
              </div>
              {mustCapture && currentPlayer === playerColor && (
                <div className="mt-2 text-yellow-400 text-sm animate-pulse">
                  ⚠️ Você tem que capturar!
                </div>
              )}
            </div>

            {/* Board Grid */}
            <div className="bg-amber-950 p-3 rounded-2xl shadow-2xl border border-amber-600/30">
              <div className="grid grid-cols-8 gap-0 border-2 border-amber-700">
                {board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const isDark = (rowIndex + colIndex) % 2 === 1;
                    const valid = isValidMove(rowIndex, colIndex);
                    const selected = isSelected(rowIndex, colIndex);

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        disabled={currentPlayer !== playerColor && !valid}
                        className={`
                          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                          flex items-center justify-center
                          transition-all duration-150
                          ${isDark 
                            ? 'bg-amber-800 hover:bg-amber-700' 
                            : 'bg-amber-200 hover:bg-amber-100'
                          }
                          ${valid ? 'ring-2 ring-green-400 ring-inset' : ''}
                          ${selected ? 'ring-2 ring-blue-400 ring-inset' : ''}
                        `}
                      >
                        {piece && (
                          <div
                            className={`
                              w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full
                              flex items-center justify-center
                              shadow-lg
                              ${piece.type?.includes('white')
                                ? 'bg-gradient-to-br from-amber-100 to-amber-300 border-2 border-amber-400'
                                : 'bg-gradient-to-br from-stone-700 to-stone-900 border-2 border-stone-600'
                              }
                              ${piece.type?.includes('king') ? 'ring-2 ring-yellow-400' : ''}
                            `}
                          >
                            {piece.type?.includes('king') && (
                              <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
                        )}
                        {valid && !piece && (
                          <div className="w-3 h-3 rounded-full bg-green-400/50 animate-pulse" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Player Info - Right */}
          <div className="order-3 bg-amber-800/30 backdrop-blur-sm rounded-2xl border border-amber-600/20 p-6 min-w-[200px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-amber-950 font-bold text-2xl mb-3">
                {myName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="font-semibold text-amber-100">{myName || 'Você'}</div>
              <div className="text-sm text-amber-400">Você ({playerColor === 'white' ? 'Brancas' : 'Pretas'})</div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-400" />
                <span className="text-amber-300">{capturedPieces.white} capturadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
