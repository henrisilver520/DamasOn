import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TableCard } from './TableCard';
import { CreateTableModal } from './CreateTableModal';
import { OnlineUsersModal } from './OnlineUsersModal';
import { StatsModal } from './StatsModal';
import { CheckerBoard } from './CheckerBoard';
import { BuyCoinsModal } from "./BuyCoinsModal";

export function Lobby() {
  const { auth, profile, tables, onlineUsers, logout, currentTable, leaveTable, setCurrentTable, activeTable, buyCoinsPrompt, closeBuyCoinsPrompt } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [viewMode, setViewMode] = useState<'lobby' | 'waiting' | 'playing'>('lobby');

  // Sincroniza currentTable com activeTable do Firebase
  useEffect(() => {
    if (activeTable) {
      setCurrentTable(activeTable);
    }
  }, [activeTable]);

  // Atualiza viewMode baseado no currentTable (inclui quando é setado manualmente após criar mesa)
  useEffect(() => {
    if (currentTable) {
      if (currentTable.status === 'playing') {
        setViewMode('playing');
      } else if (currentTable.status === 'waiting') {
        setViewMode('waiting');
      }
    } else {
      setViewMode('lobby');
    }
  }, [currentTable?.id, currentTable?.status]);

  const waitingTables = tables.filter(t => t.status === 'waiting' && t.createdByUid !== auth.user?.id);
  const myTable = tables.find(t => t.createdByUid === auth.user?.id && t.status !== 'finished');
  const isCreator = currentTable?.createdByUid === auth.user?.id;
  const balance = profile?.balance ?? 0;
  const locked = profile?.locked ?? 0;
  const buyCoinsOpen = Boolean(buyCoinsPrompt) || showBuyCoins;
  const buyCoinsBalance = buyCoinsPrompt?.balance ?? balance;

  const buyCoinsModal = (
    <BuyCoinsModal
      open={buyCoinsOpen}
      stake={buyCoinsPrompt?.stake}
      balance={buyCoinsBalance}
      onClose={() => {
        closeBuyCoinsPrompt();
        setShowBuyCoins(false);
      }}
    />
  );

  // TELA DE ESPERA (criador aguardando oponente)
  if (viewMode === 'waiting' && currentTable && isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex items-center justify-center p-4">
        <div className="bg-amber-900/60 rounded-3xl border-2 border-amber-600/40 p-8 max-w-md w-full text-center shadow-2xl">
          {/* Ícone animado */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
            <div className="w-24 h-24 rounded-full bg-amber-700/50 flex items-center justify-center">
              <svg className="w-12 h-12 text-amber-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-amber-100 mb-2">Aguardando Oponente</h2>
          <p className="text-amber-300/80 mb-6">
            Sua mesa está aberta e visível para outros jogadores.
          </p>

          {/* Detalhes da mesa */}
          <div className="bg-amber-950/40 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-amber-400">Tipo:</span>
              <span className="text-amber-200">
                {currentTable.kind === 'bet' ? `Aposta (${currentTable.stake ?? 0} moedas)` : 'Amistoso'}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-amber-400">Criador:</span>
              <span className="text-amber-200">{currentTable.createdByName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-400">Status:</span>
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Aguardando...
              </span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('lobby')}
              className="flex-1 px-4 py-3 bg-amber-700/50 hover:bg-amber-600/50 text-amber-200 rounded-xl font-medium transition"
            >
              Minimizar
            </button>
            <button
              onClick={() => {
                leaveTable();
                setViewMode('lobby');
              }}
              className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-medium transition"
            >
              Cancelar Mesa
            </button>
          </div>
        </div>
        {buyCoinsModal}
      </div>
    );
  }

  // TELA DO JOGO (playing)
   // TELA DO JOGO (playing)
  if (viewMode === 'playing' && currentTable) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950">
          <CheckerBoard
            table={currentTable}
            playerColor={isCreator ? 'white' : 'black'}
            onMinimize={() => setViewMode('lobby')}
            onExit={() => {
              leaveTable();
              setViewMode('lobby');
            }}
          />
        </div>

        {buyCoinsModal}
      </>
    );
  }


  // LOBBY (visualização normal)
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
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-semibold">{balance}</span>
                {locked > 0 && (
                  <span className="text-xs text-amber-400/80">({locked} bloqueadas)</span>
                )}
              </div>
              <button
                onClick={() => setShowBuyCoins(true)}
                className="rounded-lg bg-amber-600/70 px-2 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-500"
              >
                Comprar
              </button>
            </div>
            {/* Minha mesa - botão rápido */}
            {myTable && (
              <button
                onClick={() => myTable.status === 'waiting' ? setViewMode('waiting') : setViewMode('playing')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-amber-100 transition"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Ver Minha Mesa
              </button>
            )}

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

            {/* Stats button */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 rounded-lg text-amber-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Estatísticas</span>
            </button>

            <button
              onClick={() => setShowBuyCoins(true)}
              className="sm:hidden flex items-center gap-2 px-3 py-2 bg-amber-800/50 hover:bg-amber-700/50 rounded-lg text-amber-200 transition"
              title="Comprar moedas"
            >
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-semibold">{balance}</span>
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

      {/* Banner de mesa ativa minimizada */}
      {myTable && (
        <div className="bg-amber-600/20 border-b border-amber-500/30">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-amber-200 text-sm">
                Você tem uma mesa {myTable.status === 'waiting' ? 'aguardando oponente' : 'em andamento'}
                {myTable.kind === 'bet' && (
                  <span className="ml-2 text-yellow-300">({myTable.stake ?? 0} moedas)</span>
                )}
              </span>
            </div>
            <button
              onClick={() => myTable.status === 'waiting' ? setViewMode('waiting') : setViewMode('playing')}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-amber-100 rounded-lg text-sm font-medium transition"
            >
              Ver Mesa
            </button>
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
      <StatsModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} />
      {buyCoinsModal}
    </div>
  );
}
