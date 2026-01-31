import { useMemo, useState } from "react";
import { signInEmailPassword, signUpEmailPassword } from "@/services/auth";
import { useGame } from "@/contexts/GameContext";

type Mode = "login" | "signup";

export function LoginForm() {
  const { authUser, profile, saveProfile } = useGame();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // perfil
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState<number>(18);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsProfile = useMemo(() => {
    return Boolean(authUser && !profile);
  }, [authUser, profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const user = await signUpEmailPassword(email, password);
        await saveProfile({ uid: user.uid, email, name, city, age });
      } else {
        const user = await signInEmailPassword(email, password);
        // no login, se o perfil ainda não estiver salvo, pedir pra completar
        if (name && city && age) {
          await saveProfile({ uid: user.uid, email, name, city, age });
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Erro ao autenticar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl mb-4">
            <svg className="w-12 h-12 text-amber-950" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" fill="#451a03" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-amber-100 mb-2">Damas Online</h1>
          <p className="text-amber-400">Entre para jogar com jogadores do mundo todo</p>
        </div>

        {/* Card */}
        <div className="bg-amber-900/40 backdrop-blur-xl rounded-3xl border border-amber-600/30 p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-amber-950/50 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-lg"
                  : "text-amber-400 hover:text-amber-200"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-lg"
                  : "text-amber-400 hover:text-amber-200"
              }`}
              onClick={() => setMode("signup")}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-amber-300 mb-2">Email</label>
              <input
                className="w-full bg-amber-950/50 border border-amber-600/30 rounded-xl px-4 py-3 text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-amber-300 mb-2">Senha</label>
              <input
                className="w-full bg-amber-950/50 border border-amber-600/30 rounded-xl px-4 py-3 text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-amber-500/70">Mínimo 6 caracteres</p>
            </div>

            {/* Profile Fields */}
            {(mode === "signup" || needsProfile) && (
              <div className="bg-amber-800/30 rounded-2xl border border-amber-600/20 p-5 space-y-4">
                <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Dados do perfil
                </p>
                
                <div>
                  <label className="block text-xs font-medium text-amber-400 mb-1">Nome completo</label>
                  <input
                    className="w-full bg-amber-950/50 border border-amber-600/30 rounded-lg px-3 py-2 text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500/50 transition-all"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "signup" || needsProfile}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1">Cidade</label>
                    <input
                      className="w-full bg-amber-950/50 border border-amber-600/30 rounded-lg px-3 py-2 text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500/50 transition-all"
                      placeholder="Sua cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required={mode === "signup" || needsProfile}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-400 mb-1">Idade</label>
                    <input
                      className="w-full bg-amber-950/50 border border-amber-600/30 rounded-lg px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-500/50 transition-all"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      min={1}
                      max={120}
                      required={mode === "signup" || needsProfile}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={busy}
              type="submit"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aguarde...
                </span>
              ) : mode === "signup" ? (
                "Criar conta"
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-amber-600/20 text-center">
            <p className="text-xs text-amber-500/70">
              Ao entrar, você concorda com os termos de uso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
