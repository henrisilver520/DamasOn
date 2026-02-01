import { useGame } from "@/contexts/GameContext";
import { Table } from "@/types/domain";

interface TableCardProps {
  table: Table;
  isOwn?: boolean;
}

export function TableCard({ table, isOwn }: TableCardProps) {
  const { auth, joinTable, leaveTable, setCurrentTable, currentTable } = useGame();
  const isJoined = currentTable?.id === table.id;
  const isOpponent = table.opponentUid === auth.user?.id;
  const isBet = table.kind === "bet";

  const getStatusColor = () => {
    switch (table.status) {
      case 'waiting':
        return 'bg-green-500';
      case 'playing':
        return 'bg-amber-500';
      case 'finished':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusText = () => {
    switch (table.status) {
      case 'waiting':
        return 'Aguardando';
      case 'playing':
        return 'Em partida';
      case 'finished':
        return 'Finalizada';
      default:
        return table.status;
    }
  };

  const handleJoin = async () => {
    if (table.status === 'waiting' && !isOwn && !table.opponentUid) {
      try {
        await joinTable(table.id);
      } catch (err) {
        console.error('Erro ao entrar na mesa:', err);
      }
    }
  };

  const handleLeave = async () => {
    if (isJoined || isOpponent) {
      await leaveTable();
    }
  };

  const handleEnterGame = () => {
    if (table.status === 'playing' && (isOwn || isOpponent)) {
      setCurrentTable(table);
    }
  };

  return (
    <div className={`bg-amber-800/30 backdrop-blur-sm rounded-2xl border ${
      isOwn ? 'border-amber-400/50 shadow-lg shadow-amber-500/10' : 'border-amber-600/20'
    } p-5 transition-all hover:bg-amber-800/40`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${table.status === 'waiting' ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium text-amber-300">{getStatusText()}</span>
        </div>
        {isBet && (
          <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {table.stake ?? 0} moedas
          </div>
        )}
        {!isBet && (
          <span className="text-xs text-amber-500/70 bg-amber-900/30 px-2 py-1 rounded-full">
            Amistoso
          </span>
        )}
      </div>

      {/* Creator Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-amber-950 font-bold text-lg">
            {table.createdByName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-amber-100">{table.createdByName}</div>
            <div className="text-sm text-amber-400">{table.createdByCity || 'Cidade não informada'}</div>
            {table.createdByAge && (
              <div className="text-xs text-amber-500/70">{table.createdByAge} anos</div>
            )}
          </div>
          {isOwn && (
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
              Sua mesa
            </span>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between mb-4 py-3 border-t border-b border-amber-600/20">
        <div className="text-center flex-1">
          <div className="text-xs text-amber-500 mb-1">Jogador 1</div>
          <div className="text-sm font-medium text-amber-100">{table.createdByName}</div>
        </div>
        <div className="text-amber-600 font-bold">VS</div>
        <div className="text-center flex-1">
          <div className="text-xs text-amber-500 mb-1">Jogador 2</div>
          <div className="text-sm font-medium text-amber-100">
            {table.opponentName || 'Aguardando...'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {table.status === 'waiting' && (
          <>
            {isOwn ? (
              <button
                onClick={handleLeave}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            ) : table.opponentUid ? (
              <button
                disabled
                className="flex-1 py-2.5 bg-amber-700/30 text-amber-500/50 rounded-xl font-medium cursor-not-allowed"
              >
                Mesa cheia
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={!!currentTable && !isJoined}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Entrar
              </button>
            )}
          </>
        )}

        {table.status === 'playing' && (isOwn || isOpponent) && (
          <button
            onClick={handleEnterGame}
            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ver partida
          </button>
        )}

        {(isJoined || isOpponent) && table.status === 'waiting' && !isOwn && (
          <button
            onClick={handleLeave}
            className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        )}
      </div>
    </div>
  );
}
