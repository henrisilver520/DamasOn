import { useGame } from '@/contexts/GameContext';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnlineUsersModal({ isOpen, onClose }: OnlineUsersModalProps) {
  const { onlineUsers } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-amber-900/95 backdrop-blur-xl rounded-3xl border border-amber-600/30 shadow-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-4 border-b border-amber-600/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              Jogadores Online
              <span className="bg-amber-600 px-2.5 py-0.5 rounded-full text-sm">
                {onlineUsers.length}
              </span>
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
        <div className="flex-1 overflow-y-auto p-4">
          {onlineUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-amber-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-amber-200 mb-2">
                Nenhum jogador online
              </h3>
              <p className="text-amber-400/70">
                Aguarde ou convide amigos para jogar!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center gap-4 p-4 bg-amber-800/30 rounded-xl border border-amber-600/20 hover:bg-amber-800/50 transition"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-amber-950 font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-amber-900 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-amber-100 truncate">{user.name}</div>
                    <div className="text-sm text-amber-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {user.city}
                      {user.age && (
                        <span className="text-amber-500">
                          • {user.age} anos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-amber-950/30 px-6 py-3 border-t border-amber-600/20 flex-shrink-0">
          <p className="text-xs text-amber-500/70 text-center">
            Lista atualizada automaticamente • Status online verificado a cada 15 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
