import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TableCard } from './TableCard';
import { CreateTableModal } from './CreateTableModal';
import { OnlineUsersModal } from './OnlineUsersModal';
import { CheckerBoard } from './CheckerBoard';

export function Lobby() {
  const { auth, tables, onlineUsers, logout, currentTable, leaveTable, setCurrentTable, activeTable, profile } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Sincroniza currentTable com activeTable do Firebase
  useEffect(() => {
    if (activeTable && !currentTable) {
      setCurrentTable(activeTable);
    }
  }, [activeTable, currentTable, setCurrentTable]);

  const waitingTables = tables.filter(t => t.status === 'waiting');
  const myTable = tables.find(t => t.createdByUid === auth.user?.id);
  const isPlaying = currentTable?.status === 'playing';
  const isWaitingForOpponent = currentTable?.status === 'waiting' && currentTable.createdByUid === auth.user?.id;

  // Se está em uma partida ativa e não minimizado, mostra o tabuleiro
  if (isPlaying && !isMinimized && currentTable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950">
        <CheckerBoard
          table={currentTable}
          playerColor={currentTable.createdByUid === auth.user?.id ? 'white' : 'black'}
          onExit={() => {
            leaveTable();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950">
      {/* Header */}
      <header className="bg-amber-950/50 border-b border-amber-600/30 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-amber-100" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" fill="#78350f" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-amber-100">Damas Online</h1>
          </div>

          {/* User info */}
          <div className="flex items-center gap-4">
            {/* Online users button */}
            <button
              onClick={() => setShowUsersModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 rounded-lg text-amber-200 transition"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Usuários Online</span>
              <span className="bg-amber-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {onlineUsers.length}
              </span>
            </button>

            {/* User profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-amber-100 font-medium">{auth.user?.name}</div>
                <div className="text-amber-400 text-xs">{auth.user?.city}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-amber-100 font-bold shadow-lg">
                {auth.user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-amber-800/50 rounded-lg text-amber-400 hover:text-amber-200 transition"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Waiting for opponent banner */}
      {isWaitingForOpponent && currentTable && (
        <div className="bg-amber-500/20 border-b border-amber-500/30">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full" />
              <span className="text-amber-200">
                Aguardando oponente para sua mesa...
                {currentTable.kind === 'bet' && (
                  <span className="ml-2 text-yellow-300">({currentTable.betAmount} fichas)</span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(false)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-amber-100 rounded-lg text-sm font-medium transition"
              >
                Ver Mesa
              </button>
              <button
                onClick={() => leaveTable()}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!!myTable}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-700 disabled:to-amber-800 disabled:cursor-not-allowed text-amber-950 disabled:text-amber-500 font-semibold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {myTable ? 'Você já tem uma mesa' : 'Criar Mesa'}
          </button>
        </div>

        {/* Tables grid */}
        <div>
          <h2 className="text-2xl font-bold text-amber-100 mb-4 flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Mesas Disponíveis
            <span className="text-base font-normal text-amber-400">
              ({waitingTables.length} {waitingTables.length === 1 ? 'mesa' : 'mesas'})
            </span>
          </h2>

          {waitingTables.length === 0 ? (
            <div className="bg-amber-800/20 rounded-2xl border border-amber-600/20 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-semibold text-amber-200 mb-2">
                Nenhuma mesa disponível
              </h3>
              <p className="text-amber-400/70 mb-4">
                Seja o primeiro a criar uma mesa e aguarde um oponente!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!!myTable}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-amber-100 font-medium rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Mesa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingTables.map(table => (
                <TableCard 
                  key={table.id} 
                  table={table} 
                  isOwn={table.createdByUid === auth.user?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Playing tables */}
        {tables.filter(t => t.status === 'playing').length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-amber-100 mb-4 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Partidas em Andamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.filter(t => t.status === 'playing').map(table => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTableModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <OnlineUsersModal isOpen={showUsersModal} onClose={() => setShowUsersModal(false)} />
    </div>
  );
}
