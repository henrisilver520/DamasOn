import { useGame } from '@/contexts/GameContext';
import { Maximize2, X } from 'lucide-react';

export function MinimizedBoard() {
  const { 
    currentGame, 
    toggleMinimize, 
    leaveTable, 
    cancelTable, 
    getMyActiveTable,
    user,
    isMyTurn,
    getPlayerColor
  } = useGame();

  if (!currentGame) return null;

  const myTable = getMyActiveTable();
  const myTurn = isMyTurn();
  const playerColor = getPlayerColor();

  const handleClose = async () => {
    if (myTable) {
      if (myTable.hostId === user?.id) {
        await cancelTable(myTable.id);
      } else {
        await leaveTable(myTable.id);
      }
    }
  };

  const redPieces = currentGame.pieces.filter(p => p.color === 'red').length;
  const blackPieces = currentGame.pieces.filter(p => p.color === 'black').length;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl z-50 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Jogo em Andamento</h3>
        <div className="flex gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Maximizar"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-white/70 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
            title="Sair"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <div>
            <p className="text-white text-sm">{currentGame.redPlayerName}</p>
            <p className="text-white/50 text-xs">{redPieces} peças</p>
          </div>
        </div>

        <span className="text-white/30 text-sm">VS</span>

        <div className="flex items-center gap-2">
          <div>
            <p className="text-white text-sm text-right">{currentGame.blackPlayerName}</p>
            <p className="text-white/50 text-xs text-right">{blackPieces} peças</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
        </div>
      </div>

      <div className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${
        myTurn 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-white/5 text-white/70'
      }`}>
        {currentGame.status === 'finished' ? (
          <span className="text-amber-400">
            🏆 {currentGame.winner === 'red' ? currentGame.redPlayerName : currentGame.blackPlayerName} venceu!
          </span>
        ) : (
          <>
            {myTurn ? '🎯 Sua vez!' : '⏳ Aguardando oponente...'}
          </>
        )}
      </div>

      {playerColor && (
        <p className="text-center text-white/50 text-xs mt-2">
          Você joga com: {playerColor === 'red' ? 'Vermelho 🔴' : 'Preto ⚫'}
        </p>
      )}
    </div>
  );
}
