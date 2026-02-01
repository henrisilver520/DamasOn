import React, { useState, useEffect, useCallback } from "react";
import type { TableDoc } from "@/types/domain";
import { useCheckers, type PieceType } from "@/hooks/useCheckers";
import { useGame } from "@/contexts/GameContext";
import { updateMatchResult } from "@/services/stats";
import { db, firebase } from "@/firebase/firebase";
import { GameChat } from "@/components/GameChat";

interface CheckerBoardProps {
  table: TableDoc;
  playerColor: "white" | "black";
  onExit: () => void;
  onMinimize?: () => void;
}

export function CheckerBoard({ table, playerColor, onExit, onMinimize }: CheckerBoardProps) {
  const { authUser, profile } = useGame();

  // ✅ tableId SEMPRE vem de table.id (não existe variável tableId no componente)
  const gameId = table.id;

  const {
    board,
    currentPlayer,
    selectedPiece,
    validMoves,
    mustCapture,
    whitePieces,
    blackPieces,
    whiteKings,
    blackKings,
    gameOver,
    winner,
    lastMove,
    isMyTurn,
    selectPiece,
    makeMove,
    resign,
  } = useCheckers(gameId, playerColor);

  const [statsSaved, setStatsSaved] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  const [capturedByWhite, setCapturedByWhite] = useState(0);
  const [capturedByBlack, setCapturedByBlack] = useState(0);

  const opponentName = playerColor === "white" ? table.opponentName : table.createdByName;
  const myName = playerColor === "white" ? table.createdByName : table.opponentName;
  const opponentColor = playerColor === "white" ? "black" : "white";

  // Capturas: 12 peças iniciais (8x8)
  useEffect(() => {
    setCapturedByWhite(12 - blackPieces);
    setCapturedByBlack(12 - whitePieces);
  }, [whitePieces, blackPieces]);

  // Salva estatísticas quando o jogo termina (uma vez)
  useEffect(() => {
    if (!gameOver || statsSaved) return;
    if (!profile || !authUser) return;

    const save = async () => {
      try {
        let result: "win" | "loss" | "draw";
        if (winner === "draw") result = "draw";
        else if (winner === playerColor) result = "win";
        else result = "loss";

        const myCaptures = playerColor === "white" ? capturedByWhite : capturedByBlack;
        const myLosses = playerColor === "white" ? capturedByBlack : capturedByWhite;

await updateMatchResult(authUser.uid, profile.name, result, myCaptures, myLosses, gameId);

        // Marca resultado no doc do jogo (sem mexer no estado do tabuleiro)
        await db
          .collection("games")
          .doc(gameId)
          .set(
            {
              finishedAt: firebase.firestore.FieldValue.serverTimestamp(),
              winner: winner,
              status: "finished",
              finalScore: { white: whitePieces, black: blackPieces },
            },
            { merge: true }
          );

        setStatsSaved(true);
      } catch (e) {
        console.error("Erro ao salvar estatísticas:", e);
      }
    };

    save();
  }, [
    gameOver,
    statsSaved,
    profile,
    authUser,
    winner,
    playerColor,
    capturedByWhite,
    capturedByBlack,
    whitePieces,
    blackPieces,
    gameId,
  ]);

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!isMyTurn || gameOver) return;

      const piece = board[row][col];
      const pieceColor = piece?.includes("white") ? "white" : piece?.includes("black") ? "black" : null;

      // Seleciona peça própria
      if (piece && pieceColor === playerColor) {
        selectPiece(row, col);
        return;
      }

      // Move
      if (selectedPiece) {
        const move = validMoves.find((m) => m.to.row === row && m.to.col === col);
        if (move) makeMove(row, col);
      }
    },
    [isMyTurn, gameOver, board, playerColor, selectedPiece, validMoves, selectPiece, makeMove]
  );

  const handleResign = async () => {
    try {
      await resign();
    } finally {
      setShowResignConfirm(false);
    }
  };

  const isValidMove = (row: number, col: number) => validMoves.some((m) => m.to.row === row && m.to.col === col);

  const isSelected = (row: number, col: number) => selectedPiece?.row === row && selectedPiece?.col === col;

  const isLastMove = (row: number, col: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const getPieceIcon = (piece: PieceType) => {
    if (!piece) return null;
    const king = piece.includes("king");

    return (
      <div
        className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full
          flex items-center justify-center shadow-lg
          ${
            piece.includes("white")
              ? "bg-gradient-to-br from-amber-100 to-amber-300 border-2 border-amber-400"
              : "bg-gradient-to-br from-stone-700 to-stone-900 border-2 border-stone-600"
          }
          ${king ? "ring-2 ring-yellow-400" : ""}
        `}
      >
        {king && (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex flex-col">
      {/* Header */}
      <header className="bg-amber-950/50 border-b border-amber-600/30 backdrop-blur-lg px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowResignConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Desistir
            </button>

            {onMinimize && (
              <button
                onClick={onMinimize}
                className="flex items-center gap-2 px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 text-amber-200 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Minimizar
              </button>
            )}

            <div>
              <h1 className="text-lg font-bold text-amber-100">Partida em Andamento</h1>
              <p className="text-sm text-amber-400">
                {table.kind === "bet" ? `Aposta: ${table.betAmount} fichas` : "Partida amistosa"}
              </p>
            </div>
          </div>

          {gameOver && (
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <span className="text-green-300 font-bold">
                {winner === playerColor ? "Você venceu!" : winner === "draw" ? "Empate!" : "Você perdeu!"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Opponent */}
          <div className="order-2 lg:order-1 bg-amber-800/30 backdrop-blur-sm rounded-2xl border border-amber-600/20 p-6 min-w-[200px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-amber-950 font-bold text-2xl mb-3">
                {opponentName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="font-semibold text-amber-100">{opponentName || "Aguardando..."}</div>
              <div className="text-sm text-amber-400">
                Oponente ({opponentColor === "white" ? "Brancas" : "Pretas"})
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-400" />
                  <span className="text-amber-300">
                    {playerColor === "white" ? capturedByBlack : capturedByWhite} capturadas
                  </span>
                </div>
                <div className="text-xs text-amber-500">
                  {opponentColor === "white" ? whitePieces : blackPieces} peças restantes
                  {(opponentColor === "white" ? whiteKings : blackKings) > 0 && (
                    <span className="ml-1">
                      ({opponentColor === "white" ? whiteKings : blackKings} damas)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Board + Chat */}
          <div className="order-1 lg:order-2 flex flex-col items-center">
            {/* Turn Indicator */}
            <div className="mb-4 text-center space-y-2">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  isMyTurn
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${currentPlayer === "white" ? "bg-amber-100" : "bg-stone-800"}`} />
                <span className="font-medium">{isMyTurn ? "Sua vez!" : "Vez do oponente"}</span>
              </div>

              {mustCapture && isMyTurn && !gameOver && (
                <div className="text-yellow-400 text-sm animate-pulse bg-yellow-500/10 px-3 py-1 rounded-full inline-block">
                  ⚠️ Captura obrigatória!
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
                    const wasLastMove = isLastMove(rowIndex, colIndex);

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        disabled={!isMyTurn || gameOver}
                        className={`
                          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                          flex items-center justify-center transition-all duration-150
                          ${isDark ? "bg-amber-800" : "bg-amber-200"}
                          ${valid ? "ring-2 ring-green-400 ring-inset cursor-pointer" : ""}
                          ${selected ? "ring-2 ring-blue-400 ring-inset" : ""}
                          ${wasLastMove ? "bg-blue-500/30" : ""}
                          ${isMyTurn && isDark && !gameOver ? "hover:bg-amber-700" : ""}
                        `}
                      >
                        {getPieceIcon(piece)}
                        {valid && !piece && <div className="w-3 h-3 rounded-full bg-green-400/50 animate-pulse" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ✅ Chat abaixo do tabuleiro (SEM tableId solto; usa table.id) */}
            <div className="w-full max-w-[520px]">
              <GameChat gameId={gameId} />
            </div>
          </div>

          {/* Me */}
          <div className="order-3 bg-amber-800/30 backdrop-blur-sm rounded-2xl border border-amber-600/20 p-6 min-w-[200px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-amber-950 font-bold text-2xl mb-3">
                {myName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="font-semibold text-amber-100">{myName || "Você"}</div>
              <div className="text-sm text-amber-400">
                Você ({playerColor === "white" ? "Brancas" : "Pretas"})
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-stone-800 border-2 border-stone-600" />
                  <span className="text-amber-300">
                    {playerColor === "white" ? capturedByWhite : capturedByBlack} capturadas
                  </span>
                </div>
                <div className="text-xs text-amber-500">
                  {playerColor === "white" ? whitePieces : blackPieces} peças restantes
                  {(playerColor === "white" ? whiteKings : blackKings) > 0 && (
                    <span className="ml-1">
                      ({playerColor === "white" ? whiteKings : blackKings} damas)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resign confirm */}
      {showResignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResignConfirm(false)} />
          <div className="relative bg-amber-900/95 backdrop-blur-xl rounded-3xl border border-amber-600/30 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-amber-100 mb-4">Confirmar Desistência</h3>
            <p className="text-amber-300 mb-6">
              Tem certeza que deseja desistir?{" "}
              {table.kind === "bet" ? `Você perderá ${table.betAmount} fichas.` : "Você perderá esta partida."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResignConfirm(false)}
                className="flex-1 py-3 bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 font-medium rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleResign}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-xl transition"
              >
                Desistir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-amber-900/95 backdrop-blur-xl rounded-3xl border border-amber-600/30 shadow-2xl w-full max-w-md p-8 text-center">
            <h3 className="text-2xl font-bold text-amber-100 mb-2">
              {winner === playerColor ? "Vitória!" : winner === "draw" ? "Empate!" : "Derrota!"}
            </h3>

            <p className="text-amber-300 mb-6">
              {winner === playerColor
                ? table.kind === "bet"
                  ? `Você ganhou ${table.betAmount} fichas!`
                  : "Parabéns pela vitória!"
                : winner === "draw"
                ? "A partida terminou empatada."
                : table.kind === "bet"
                ? `Você perdeu ${table.betAmount} fichas.`
                : "Não foi dessa vez."}
            </p>

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold rounded-xl shadow-lg transition"
            >
              Voltar ao Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
