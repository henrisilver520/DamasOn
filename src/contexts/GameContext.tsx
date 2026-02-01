import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TableDoc, UserProfile } from "@/types/domain";
import { onAuthStateChanged, signOut as fbSignOut } from "@/services/auth";
import {
  listenTables,
  createTable as fbCreateTable,
  joinTable as fbJoinTable,
  leaveTable as fbLeaveTable,
  cancelTable as fbCancelTable,
} from "@/services/tables";
import { listenOnlineUsers, upsertUserProfile, listenUserProfile } from "@/services/users";
import { startPresence } from "@/services/presence";
import { joinTableWithWager } from "@/services/wagering"; // 👈 no topo

type AuthUser = {
  uid: string;
  email: string;
};

type AuthState = {
  user: { id: string; name: string; email: string; city: string; age: number } | null;
  loading: boolean;
};

type GameContextValue = {
  authUser: AuthUser | null;
  profile: UserProfile | null;
  tables: TableDoc[];
  onlineUsers: UserProfile[];
  activeTable: TableDoc | null;
  buyCoinsPrompt: null | { stake: number; balance: number };
  closeBuyCoinsPrompt: () => void;

  // Compat API (Lobby/TableCard)
  auth: AuthState;
  currentTable: TableDoc | null;
  setCurrentTable: (table: TableDoc | null) => void;
  logout: () => Promise<void>;
  leaveTable: () => Promise<void>;

  // auth/profile
  saveProfile: (p: {
    uid: string;
    email: string;
    name: string;
    country: string;
    city: string;
    age: number;
    photoURL?: string;
  }) => Promise<void>;

  signOut: () => Promise<void>;

  // tables
  createTable: (p: { kind: "free" | "bet"; stake?: number }) => Promise<void>;
  joinTable: (tableId: string) => Promise<void>;
  cancelMyTable: () => Promise<void>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [tables, setTables] = useState<TableDoc[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);

  const [currentTable, setCurrentTable] = useState<TableDoc | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [buyCoinsPrompt, setBuyCoinsPrompt] = useState<null | { stake: number; balance: number }>(null);

  function closeBuyCoinsPrompt() {
    setBuyCoinsPrompt(null);
  }

  // 1) AUTH STATE
  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
      setAuthLoading(false);

      if (!u) {
        setAuthUser(null);
        setProfile(null);
        setCurrentTable(null);
        return;
      }

      setAuthUser({ uid: u.uid, email: u.email ?? "" });
    });

    return () => unsub();
  }, []);

  // 2) PROFILE LISTENER (UsersDamas/{uid})
  useEffect(() => {
    if (!authUser) return;

    const unsub = listenUserProfile(authUser.uid, (p) => {
      setProfile(p);
    });

    return () => unsub();
  }, [authUser?.uid]);

  // 3) LOBBY LISTENERS
  useEffect(() => {
    const unsubTables = listenTables((list) => setTables(list));
    const unsubUsers = listenOnlineUsers((list) => setOnlineUsers(list));
    return () => {
      unsubTables();
      unsubUsers();
    };
  }, []);

  // 4) PRESENCE
  useEffect(() => {
    if (!authUser) return;
    const stop = startPresence(authUser.uid);
    return () => stop();
  }, [authUser?.uid]);

  // Mesa ativa: derivada do snapshot (fonte da verdade)
  const activeTable = useMemo(() => {
    if (!authUser) return null;
    const uid = authUser.uid;

    return (
      tables.find((t) => t.createdByUid === uid && t.status !== "finished") ??
      tables.find((t) => t.opponentUid === uid && t.status !== "finished") ??
      null
    );
  }, [tables, authUser?.uid]);

  // Mantém currentTable coerente: se activeTable mudar, preferimos activeTable.
  useEffect(() => {
    // se você estiver dentro de uma mesa, o snapshot manda a versão certa
    if (activeTable) setCurrentTable(activeTable);
    // se você saiu/mesa finalizou
    else setCurrentTable(null);
  }, [activeTable?.id, activeTable?.status]);

  // SAVE PROFILE
  const saveProfile: GameContextValue["saveProfile"] = useCallbackAsync(async (p) => {
    await upsertUserProfile({
      uid: p.uid,
      name: p.name,
      email: p.email,
      country: p.country,
      city: p.city,
      age: p.age,
      photoURL: p.photoURL ?? "",
    });

    // UX instantâneo (listener vai consolidar depois)
    setProfile({
      uid: p.uid,
      name: p.name,
      email: p.email,
      country: p.country,
      city: p.city,
      age: p.age,
      photoURL: p.photoURL ?? "",
      balance: 0,
      locked: 0,
      isOnline: true,
      lastActivity: Date.now(),
      createdAt: Date.now(),
    });
  });

  // SIGN OUT / LOGOUT (uma função só, sem duplicidade)
  async function signOut() {
    setCurrentTable(null);
    setProfile(null);
    setAuthUser(null);
    await fbSignOut();
  }

  async function logout() {
    await signOut();
  }

  async function createTable(p: { kind: "free" | "bet"; stake?: number }) {
    if (!authUser) throw new Error("Faça login.");
    if (!profile) throw new Error("Complete o perfil antes de jogar.");

    const newTable = await fbCreateTable({
      createdByUid: authUser.uid,
      createdByName: profile.name,
      createdByCity: profile.city,
      createdByAge: profile.age,
      kind: p.kind,
      stake: p.stake,
    });

    setCurrentTable(newTable);
  }


  async function joinTable(tableId: string) {
    if (!authUser) throw new Error("Faça login.");
    if (!profile) throw new Error("Complete o perfil antes de jogar.");

    const local = tables.find((t) => t.id === tableId);
    if (!local) throw new Error("Mesa não encontrada localmente.");

    // ✅ Se for mesa com aposta: primeiro bloqueia saldo via Function
    if (local.kind === "bet") {
      const result = await joinTableWithWager(tableId);

      if (!result.ok && result.reason === "INSUFFICIENT_BALANCE") {
        setBuyCoinsPrompt({ stake: result.stake, balance: result.balance });
        return; // não entra na mesa
      }
    }

    // ✅ Se passou (free ou bet com saldo): entra na mesa no Firestore
    await fbJoinTable(tableId, authUser.uid, profile.name);

    // currentTable será sincronizado pelo listener
    if (local) setCurrentTable({ ...local, status: "playing" });
  }

  async function cancelMyTable() {
    if (!authUser) return;
    const mine = tables.find((t) => t.createdByUid === authUser.uid && t.status === "waiting");
    if (!mine) return;
    await fbCancelTable(mine.id, authUser.uid);
  }

  async function leaveTable() {
    if (!authUser || !activeTable) return;
    await fbLeaveTable(activeTable.id, authUser.uid);
    setCurrentTable(null);
  }

  const auth: AuthState = useMemo(
    () => ({
      user: profile
        ? {
            id: profile.uid,
            name: profile.name,
            email: profile.email,
            city: profile.city,
            age: profile.age,
          }
        : null,
      loading: authLoading,
    }),
    [profile, authLoading]
  );

  const value: GameContextValue = {
    authUser,
    profile,
    tables,
    onlineUsers,
    activeTable,

    auth,
    currentTable,
    setCurrentTable,

    logout,
    leaveTable,

    saveProfile,
    signOut,

    createTable,
    joinTable,
    cancelMyTable,
    buyCoinsPrompt,
    closeBuyCoinsPrompt,

  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// helper: evita useCallback com async e dependências esquecidas
function useCallbackAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => fn, []);
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame deve ser usado dentro de GameProvider");
  return ctx;
}
