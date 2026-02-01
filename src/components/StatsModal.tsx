import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { listenUserStats, UserStats, getLeaderboard } from '@/services/stats';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { authUser } = useGame();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'ranking'>('my');

  useEffect(() => {
    if (!authUser || !isOpen) return;

    const unsub = listenUserStats(authUser.uid, setStats);
    
    // Carrega ranking
    getLeaderboard(10).then(setLeaderboard);

    return () => unsub();
  }, [authUser, isOpen]);

  if (!isOpen) return null;

  const winRate = stats && stats.totalGames > 0 
    ? Math.round((stats.wins / stats.totalGames) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-amber-900/95 backdrop-blur-xl rounded-3xl border border-amber-600/30 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-4 border-b border-amber-600/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estatísticas
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-700/50 rounded-lg text-amber-400 hover:text-amber-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'my'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'text-amber-400 hover:bg-amber-800/30'
              }`}
            >
              Minhas Estatísticas
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'ranking'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                  : 'text-amber-400 hover:bg-amber-800/30'
              }`}
            >
              Ranking
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'my' ? (
            stats ? (
              <div className="space-y-6">
                {/* Rating e Win Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-800/30 rounded-xl p-4 text-center border border-amber-600/20">
                    <div className="text-3xl font-bold text-amber-100">{stats.rating}</div>
                    <div className="text-sm text-amber-400">Rating</div>
                  </div>
                  <div className="bg-amber-800/30 rounded-xl p-4 text-center border border-amber-600/20">
                    <div className="text-3xl font-bold text-green-400">{winRate}%</div>
                    <div className="text-sm text-amber-400">Win Rate</div>
                  </div>
                </div>

                {/* Record */}
                <div className="bg-amber-800/30 rounded-xl p-4 border border-amber-600/20">
                  <h3 className="text-sm font-semibold text-amber-300 mb-3">Histórico</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                      <div className="text-xs text-amber-500">Vitórias</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{stats.draws}</div>
                      <div className="text-xs text-amber-500">Empates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                      <div className="text-xs text-amber-500">Derrotas</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-600/20 text-center">
                    <span className="text-sm text-amber-400">
                      Total de partidas: <span className="text-amber-100 font-semibold">{stats.totalGames}</span>
                    </span>
                  </div>
                </div>

                {/* Streaks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-800/30 rounded-xl p-4 text-center border border-amber-600/20">
                    <div className="text-2xl font-bold text-amber-100">{stats.currentStreak}</div>
                    <div className="text-sm text-amber-400">Sequência Atual</div>
                  </div>
                  <div className="bg-amber-800/30 rounded-xl p-4 text-center border border-amber-600/20">
                    <div className="text-2xl font-bold text-yellow-400">{stats.bestStreak}</div>
                    <div className="text-sm text-amber-400">Melhor Sequência</div>
                  </div>
                </div>

                {/* Peças */}
                <div className="bg-amber-800/30 rounded-xl p-4 border border-amber-600/20">
                  <h3 className="text-sm font-semibold text-amber-300 mb-3">Peças</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border-2 border-amber-400 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-100">{stats.piecesCaptured}</div>
                        <div className="text-xs text-amber-500">Capturadas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 border-2 border-stone-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-stone-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-100">{stats.piecesLost}</div>
                        <div className="text-xs text-amber-500">Perdidas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-amber-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-amber-200 mb-2">
                  Sem estatísticas
                </h3>
                <p className="text-amber-400/70">
                  Jogue suas primeiras partidas para ver suas estatísticas!
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-amber-400/70">Carregando ranking...</p>
                </div>
              ) : (
                leaderboard.map((player, index) => (
                  <div
                    key={player.uid}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      player.uid === authUser?.uid
                        ? 'bg-amber-500/20 border-amber-500/30'
                        : 'bg-amber-800/30 border-amber-600/20'
                    }`}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                        index === 1 ? 'bg-gray-300 text-gray-800' :
                        index === 2 ? 'bg-amber-600 text-amber-100' :
                        'bg-amber-700/50 text-amber-200'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-amber-100">{player.name}</div>
                      <div className="text-xs text-amber-400">
                        {player.wins}V {player.draws}E {player.losses}D
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-100">{player.rating}</div>
                      <div className="text-xs text-amber-500">Rating</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
