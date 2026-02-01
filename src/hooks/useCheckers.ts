import { useState, useCallback, useEffect, useRef } from "react";
import { db, firebase } from "@/firebase/firebase";

export type PieceType = "white" | "black" | "white-king" | "black-king" | null;

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  capturedPieces?: Position[]; // posições capturadas (na ordem)
  promotion?: boolean;         // se em algum momento virou dama
}

export interface GameState {
  board: PieceType[][];
  currentPlayer: "white" | "black";
  selectedPiece: Position | null;
  validMoves: Move[];
  mustCapture: boolean;

  // opcional/legado no seu state
  captureChains: Move[][];

  whitePieces: number;
  blackPieces: number;
  whiteKings: number;
  blackKings: number;

  gameOver: boolean;
  winner: "white" | "black" | "draw" | null;

  lastMove: Move | null;
  moveHistory: Move[];

  // extra p/ consistência multiplayer
  moveNumber?: number;
}

// ======================
// BOARD INIT
// ======================
export function initializeBoard(): PieceType[][] {
  const board: PieceType[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = "black";
    }
  }

  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = "white";
    }
  }

  return board;
}

function cloneBoard(board: PieceType[][]): PieceType[][] {
  return board.map((r) => [...r]) as PieceType[][];
}

function countPieces(board: PieceType[][]) {
  let white = 0,
    black = 0,
    whiteKings = 0,
    blackKings = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === "white") white++;
      else if (p === "black") black++;
      else if (p === "white-king") {
        white++;
        whiteKings++;
      } else if (p === "black-king") {
        black++;
        blackKings++;
      }
    }
  }
  return { white, black, whiteKings, blackKings };
}

function isKing(piece: PieceType): boolean {
  return piece === "white-king" || piece === "black-king";
}

function getPieceColor(piece: PieceType): "white" | "black" | null {
  if (!piece) return null;
  return piece.includes("white") ? "white" : "black";
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

const DIAGS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

function promotionRow(color: "white" | "black") {
  return color === "white" ? 0 : 7;
}

function promoteIfNeeded(piece: PieceType, toRow: number): { piece: PieceType; promoted: boolean } {
  if (!piece) return { piece, promoted: false };
  const color = getPieceColor(piece);
  if (!color) return { piece, promoted: false };

  if (!isKing(piece) && toRow === promotionRow(color)) {
    return { piece: color === "white" ? "white-king" : "black-king", promoted: true };
  }
  return { piece, promoted: false };
}

// ======================
// FIRESTORE (board 1D 64)
// ======================
type BoardFlat = PieceType[];

function flattenBoard(board: PieceType[][]): BoardFlat {
  const flat: BoardFlat = Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      flat[r * 8 + c] = board[r][c];
    }
  }
  return flat;
}

function unflattenBoard(raw: any): PieceType[][] {
  const board: PieceType[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // novo formato: array 1D
  if (Array.isArray(raw)) {
    for (let i = 0; i < 64; i++) {
      const v = raw[i] ?? null;
      const r = Math.floor(i / 8);
      const c = i % 8;
      board[r][c] = v as PieceType;
    }
    return board;
  }

  // compat: formato antigo map "r_c"
  if (raw && typeof raw === "object") {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        board[r][c] = (raw[`${r}_${c}`] ?? null) as PieceType;
      }
    }
  }

  return board;
}

// ======================
// DAMAS BRASILEIRA - MOVE ENGINE
// ======================

// 1) movimentos simples (somente quando NÃO houver captura no tabuleiro)
function generateSimpleMoves(board: PieceType[][], from: Position): Move[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const color = getPieceColor(piece);
  if (!color) return [];

  const moves: Move[] = [];

  if (isKing(piece)) {
    for (const [dr, dc] of DIAGS) {
      let dist = 1;
      while (true) {
        const r = from.row + dr * dist;
        const c = from.col + dc * dist;
        if (!inBounds(r, c)) break;
        if (board[r][c]) break;
        moves.push({ from, to: { row: r, col: c } });
        dist++;
      }
    }
    return moves;
  }

  // homem: só anda pra frente
  const forward = color === "white" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const r = from.row + forward;
    const c = from.col + dc;
    if (inBounds(r, c) && !board[r][c]) moves.push({ from, to: { row: r, col: c } });
  }

  return moves;
}

// 2) capturas: retorna TODAS as sequências de captura (DFS)
function generateCaptureSequences(board: PieceType[][], from: Position): Move[] {
  const startPiece = board[from.row][from.col];
  if (!startPiece) return [];
  const startColor = getPieceColor(startPiece);
  if (!startColor) return [];

  type Node = {
    board: PieceType[][];
    pos: Position;
    piece: PieceType;             // pode promover durante DFS
    captured: Position[];
    promotedAny: boolean;
  };

  const results: Move[] = [];

  function pushIfTerminal(node: Node) {
    // terminal se não há mais capturas a partir daqui
    const nextCaps = listImmediateCaptures(node.board, node.pos, node.piece);
    if (nextCaps.length === 0 && node.captured.length > 0) {
      results.push({
        from,
        to: node.pos,
        capturedPieces: node.captured,
        promotion: node.promotedAny,
      });
    }
  }

  function listImmediateCaptures(bd: PieceType[][], pos: Position, piece: PieceType) {
    const color = getPieceColor(piece)!;
    const caps: Array<{
      landing: Position;
      capturedPos: Position;
    }> = [];

    if (isKing(piece)) {
      // dama voadora: em cada diagonal, pode capturar 1 inimiga e pousar em qualquer vazio após ela
      for (const [dr, dc] of DIAGS) {
        let r = pos.row + dr;
        let c = pos.col + dc;

        // anda até encontrar algo
        while (inBounds(r, c) && !bd[r][c]) {
          r += dr;
          c += dc;
        }
        if (!inBounds(r, c)) continue;

        const target = bd[r][c];
        const targetColor = getPieceColor(target);
        if (!target || targetColor === color) continue;

        // depois da inimiga, todas as casas vazias são pousos válidos (até bater em outra peça ou borda)
        let lr = r + dr;
        let lc = c + dc;
        while (inBounds(lr, lc) && !bd[lr][lc]) {
          caps.push({
            landing: { row: lr, col: lc },
            capturedPos: { row: r, col: c },
          });
          lr += dr;
          lc += dc;
        }
      }
      return caps;
    }

    // homem: captura em 4 diagonais (pra frente e pra trás) na Damas Brasileira
    for (const [dr, dc] of DIAGS) {
      const midR = pos.row + dr;
      const midC = pos.col + dc;
      const landR = pos.row + dr * 2;
      const landC = pos.col + dc * 2;

      if (!inBounds(midR, midC) || !inBounds(landR, landC)) continue;
      const mid = bd[midR][midC];
      if (!mid) continue;

      const midColor = getPieceColor(mid);
      if (!midColor || midColor === color) continue;

      if (!bd[landR][landC]) {
        caps.push({
          landing: { row: landR, col: landC },
          capturedPos: { row: midR, col: midC },
        });
      }
    }

    return caps;
  }

  function dfs(node: Node) {
    const options = listImmediateCaptures(node.board, node.pos, node.piece);

    if (options.length === 0) {
      pushIfTerminal(node);
      return;
    }

    for (const opt of options) {
      const nb = cloneBoard(node.board);

      // remove capturada
      nb[opt.capturedPos.row][opt.capturedPos.col] = null;

      // move peça
      nb[node.pos.row][node.pos.col] = null;

      const movedPiece = node.piece;
      const { piece: afterPromoPiece, promoted } = promoteIfNeeded(movedPiece, opt.landing.row);

      nb[opt.landing.row][opt.landing.col] = afterPromoPiece;

      dfs({
        board: nb,
        pos: opt.landing,
        piece: afterPromoPiece,
        captured: [...node.captured, opt.capturedPos],
        promotedAny: node.promotedAny || promoted,
      });
    }
  }

  dfs({
    board,
    pos: from,
    piece: startPiece,
    captured: [],
    promotedAny: false,
  });

  return results;
}

// 3) gera as jogadas legais do turno respeitando:
// - captura obrigatória
// - maior número de capturas (global)
function computeLegalMoves(board: PieceType[][], player: "white" | "black") {
  const captures: Move[] = [];
  const simples: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (getPieceColor(p) !== player) continue;

      const from = { row: r, col: c };
      const seq = generateCaptureSequences(board, from);
      if (seq.length > 0) captures.push(...seq);
      else simples.push(...generateSimpleMoves(board, from));
    }
  }

  if (captures.length > 0) {
    const maxCaps = Math.max(...captures.map((m) => m.capturedPieces?.length || 0));
    const filtered = captures.filter((m) => (m.capturedPieces?.length || 0) === maxCaps);

    return {
      mustCapture: true,
      moves: filtered,
      maxCaptureCount: maxCaps,
    };
  }

  return {
    mustCapture: false,
    moves: simples,
    maxCaptureCount: 0,
  };
}

function checkGameOver(board: PieceType[][], currentPlayer: "white" | "black") {
  const counts = countPieces(board);
  if (counts.white === 0) return { over: true, winner: "black" as const };
  if (counts.black === 0) return { over: true, winner: "white" as const };

  const legal = computeLegalMoves(board, currentPlayer);
  if (legal.moves.length === 0) {
    return { over: true, winner: currentPlayer === "white" ? ("black" as const) : ("white" as const) };
  }

  return { over: false, winner: null as const };
}

// ======================
// HOOK
// ======================
export function useCheckers(tableId: string, playerColor: "white" | "black") {
  const [state, setState] = useState<GameState>(() => {
    const initialBoard = initializeBoard();
    const counts = countPieces(initialBoard);
    const legal = computeLegalMoves(initialBoard, "white");

    return {
      board: initialBoard,
      currentPlayer: "white",
      selectedPiece: null,
      validMoves: [],
      mustCapture: legal.mustCapture,
      captureChains: [],
      whitePieces: counts.white,
      blackPieces: counts.black,
      whiteKings: counts.whiteKings,
      blackKings: counts.blackKings,
      gameOver: false,
      winner: null,
      lastMove: null,
      moveHistory: [],
      moveNumber: 0,
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const saveState = useCallback(
    async (newState: GameState) => {
      if (!tableId) return;

      try {
        const stateForFirestore = {
          ...newState,
          board: flattenBoard(newState.board),
          moveNumber: newState.moveNumber ?? (newState.moveHistory?.length || 0),
        };

        await db
          .collection("games")
          .doc(tableId)
          .set(
            {
              state: stateForFirestore,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      } catch (e) {
        console.error("Erro ao salvar estado:", e);
      }
    },
    [tableId]
  );

  useEffect(() => {
    if (!tableId) return;

    const ref = db.collection("games").doc(tableId);

    ref.get().then(async (doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data?.state) {
          const serverState = data.state as any;
          const board = unflattenBoard(serverState.board);

          const currentPlayer = (serverState.currentPlayer || "white") as "white" | "black";
          const legal = computeLegalMoves(board, currentPlayer);
          const counts = countPieces(board);

          setState({
            ...serverState,
            board,
            mustCapture: legal.mustCapture,
            validMoves: [], // só aparece ao selecionar
            selectedPiece: null,
            whitePieces: counts.white,
            blackPieces: counts.black,
            whiteKings: counts.whiteKings,
            blackKings: counts.blackKings,
          } as GameState);
          return;
        }
      }

      // cria jogo novo
      const initialBoard = initializeBoard();
      const counts = countPieces(initialBoard);
      const initialState: GameState = {
        board: initialBoard,
        currentPlayer: "white",
        selectedPiece: null,
        validMoves: [],
        mustCapture: computeLegalMoves(initialBoard, "white").mustCapture,
        captureChains: [],
        whitePieces: counts.white,
        blackPieces: counts.black,
        whiteKings: counts.whiteKings,
        blackKings: counts.blackKings,
        gameOver: false,
        winner: null,
        lastMove: null,
        moveHistory: [],
        moveNumber: 0,
      };

      await ref.set(
        {
          state: {
            ...initialState,
            board: flattenBoard(initialBoard),
          },
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      setState(initialState);
    });

    const unsub = ref.onSnapshot((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      if (!data?.state) return;

      const serverState = data.state as any;

      const serverMoveNumber = Number(serverState.moveNumber ?? (serverState.moveHistory?.length || 0));
const localMoveNumber = Number(stateRef.current.moveNumber ?? (stateRef.current.moveHistory?.length || 0));

const serverGameOver = Boolean(serverState.gameOver);
const localGameOver = Boolean(stateRef.current.gameOver);

// ✅ regra de aplicação:
const mustApply =
  // aplica sempre quando o servidor finaliza o jogo e o local ainda não finalizou
  (serverGameOver && !localGameOver)
  // ou aplica quando servidor é mais novo
  || (serverMoveNumber > localMoveNumber);

if (!mustApply) return;


      const board = unflattenBoard(serverState.board);
      const currentPlayer = (serverState.currentPlayer || "white") as "white" | "black";
      const legal = computeLegalMoves(board, currentPlayer);
      const counts = countPieces(board);

      setState({
        ...serverState,
        board,
        mustCapture: legal.mustCapture,
        // segurança: reseta seleção local
        selectedPiece: null,
        validMoves: [],
        whitePieces: counts.white,
        blackPieces: counts.black,
        whiteKings: counts.whiteKings,
        blackKings: counts.blackKings,
      } as GameState);
    });

    return () => unsub();
  }, [tableId]);

  // Selecionar peça: filtra pelas jogadas legais do turno e por "from"
  const selectPiece = useCallback((row: number, col: number) => {
    setState((prev) => {
      const piece = prev.board[row][col];
      if (!piece) return { ...prev, selectedPiece: null, validMoves: [] };
      if (getPieceColor(piece) !== prev.currentPlayer) return { ...prev, selectedPiece: null, validMoves: [] };

      const legal = computeLegalMoves(prev.board, prev.currentPlayer);
      const fromMoves = legal.moves.filter((m) => m.from.row === row && m.from.col === col);

      return {
        ...prev,
        mustCapture: legal.mustCapture,
        selectedPiece: { row, col },
        validMoves: fromMoves,
      };
    });
  }, []);

  // Aplicar jogada escolhida (já vem como sequência completa, com todas as capturas)
  const makeMove = useCallback(
    (toRow: number, toCol: number) => {
      setState((prev) => {
        if (prev.gameOver) return prev;
        if (!prev.selectedPiece) return prev;

        const chosen = prev.validMoves.find((m) => m.to.row === toRow && m.to.col === toCol);
        if (!chosen) return prev;

        const nb = cloneBoard(prev.board);

        const from = prev.selectedPiece;
        let piece = nb[from.row][from.col];
        if (!piece) return prev;

        // remove capturas
        for (const cap of chosen.capturedPieces ?? []) {
          nb[cap.row][cap.col] = null;
        }

        // move peça
        nb[from.row][from.col] = null;

        // promoção final (a sequência já pode ter promovido no meio; aqui garantimos no destino final)
        const promo = promoteIfNeeded(piece, chosen.to.row);
        piece = promo.piece;
        nb[chosen.to.row][chosen.to.col] = piece;

        const nextPlayer = prev.currentPlayer === "white" ? "black" : "white";
        const counts = countPieces(nb);
        const status = checkGameOver(nb, nextPlayer);

        const newMoveNumber = (prev.moveNumber ?? prev.moveHistory.length) + 1;

        const newState: GameState = {
          ...prev,
          board: nb,
          currentPlayer: nextPlayer,
          selectedPiece: null,
          validMoves: [],
          mustCapture: computeLegalMoves(nb, nextPlayer).mustCapture,
          whitePieces: counts.white,
          blackPieces: counts.black,
          whiteKings: counts.whiteKings,
          blackKings: counts.blackKings,
          gameOver: status.over,
          winner: status.winner,
          lastMove: chosen,
          moveHistory: [...prev.moveHistory, chosen],
          moveNumber: newMoveNumber,
        };

        saveState(newState).catch(console.error);
        return newState;
      });
    },
    [saveState]
  );

  const resign = useCallback(async () => {
  const current = stateRef.current;

  // vencedor é o oponente
  const winner: "white" | "black" = playerColor === "white" ? "black" : "white";

  // ✅ incrementa moveNumber para forçar snapshot no outro cliente
  const nextMoveNumber = (current.moveNumber ?? current.moveHistory.length) + 1;

  const finalState: GameState = {
    ...current,
    gameOver: true,
    winner,
    mustCapture: false,
    selectedPiece: null,
    validMoves: [],
    moveNumber: nextMoveNumber,
  };

  // salva no firestore
  try {
    await db.collection("games").doc(tableId).set(
      {
        status: "finished",
        finishedAt: firebase.firestore.FieldValue.serverTimestamp(),
        winner,
        state: {
          ...finalState,
          board: flattenBoard(finalState.board),
        },
      },
      { merge: true }
    );
  } catch (e) {
    console.error("Erro ao desistir:", e);
  }

  // atualiza local imediato
  setState(finalState);
}, [playerColor, tableId]);

  const isMyTurn = state.currentPlayer === playerColor;

  return {
    ...state,
    isMyTurn,
    selectPiece,
    makeMove,
    resign,
  };
}
