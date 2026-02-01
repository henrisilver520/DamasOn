import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTableModal({ isOpen, onClose }: CreateTableModalProps) {
  const { createTable } = useGame();
  const [isBet, setIsBet] = useState(false);
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createTable({
        kind: isBet ? 'bet' : 'free',
        stake: isBet ? stake : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-amber-900/95 backdrop-blur-xl rounded-3xl border border-amber-600/30 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-4 border-b border-amber-600/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Criar Nova Mesa
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
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Game Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-amber-300">Tipo de Partida</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsBet(false)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !isBet
                    ? 'border-amber-500 bg-amber-500/20'
                    : 'border-amber-600/30 bg-amber-800/30 hover:bg-amber-700/30'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-medium ${!isBet ? 'text-amber-100' : 'text-amber-400'}`}>
                    Amistoso
                  </span>
                  <span className="text-xs text-amber-500">Grátis</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsBet(true)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isBet
                    ? 'border-yellow-500 bg-yellow-500/20'
                    : 'border-amber-600/30 bg-amber-800/30 hover:bg-amber-700/30'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className={`font-medium ${isBet ? 'text-yellow-100' : 'text-amber-400'}`}>
                    Apostado
                  </span>
                  <span className="text-xs text-amber-500">Com moedas</span>
                </div>
              </button>
            </div>
          </div>

          {/* Bet Amount */}
          {isBet && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-amber-300">Valor da Aposta</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="flex-1 h-2 bg-amber-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-xl font-bold min-w-[100px] justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {stake}
                </div>
              </div>
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setStake(amount)}
                    className="flex-1 py-1.5 bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 rounded-lg text-sm transition"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-amber-800/30 rounded-xl p-4 border border-amber-600/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-amber-300">
                <p className="font-medium mb-1">Como funciona:</p>
                <ul className="space-y-1 text-amber-400/80">
                  <li>• Sua mesa ficará visível para todos os jogadores</li>
                  <li>• Você pode cancelar enquanto aguarda oponente</li>
                  <li>• {isBet ? 'O vencedor recebe as moedas apostadas' : 'Partida amistosa sem apostas'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 font-medium rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Criando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar Mesa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
