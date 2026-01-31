import { GameProvider, useGame } from "@/contexts/GameContext";
import { LoginForm } from "@/components/LoginForm";
import { Lobby } from "@/components/Lobby";

function Shell() {
  const { authUser, profile } = useGame();

  // Se não estiver autenticado, mostra login.
  // Se autenticou mas ainda não salvou perfil no Firestore, o LoginForm libera campos de perfil.
  if (!authUser || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-100 p-6">
        <div className="pt-10">
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-100">
      <Lobby />
    </div>
  );
}

export function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
