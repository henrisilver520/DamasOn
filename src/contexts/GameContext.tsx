import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TableDoc, UserProfile } from "@/types/domain";
import { onAuthStateChanged, signOut as fbSignOut } from "@/services/auth";
import { listenTables, createTable as fbCreateTable, joinTable as fbJoinTable, leaveTable as fbLeaveTable, cancelTable as fbCancelTable } from "@/services/tables";
import { listenOnlineUsers, upsertUserProfile } from "@/services/users";
import { startPresence } from "@/services/presence";

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
  
  // Compat API (Lobby/TableCard)
  auth: AuthState;
  currentTable: TableDoc | null;
  setCurrentTable: (table: TableDoc | null) => void;
  logout: () => Promise<void>;
  leaveTable: () => Promise<void>;

  // auth/profile
  saveProfile: (p: { name: string; city: string; age: number; email: string; uid: string }) => Promise<void>;
  signOut: () => Promise<void>;

  // tables
  createTable: (p: { kind: "free" | "bet"; betAmount?: number }) => Promise<void>;
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

  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
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

  // listeners lobby
  useEffect(() => {
    const unsubTables = listenTables(setTables);
    const unsubUsers = listenOnlineUsers(setOnlineUsers);
    return () => {
      unsubTables();
      unsubUsers();
    };
  }, []);

  // presence
  useEffect(() => {
    if (!authUser) return;
    const stop = startPresence(authUser.uid);
    return () => stop();
  }, [authUser]);

  const activeTable = useMemo(() => {
    if (!authUser) return null;
    return (
      tables.find((t) => t.createdByUid === authUser.uid && t.status !== "finished") ??
      tables.find((t) => t.opponentUid === authUser.uid && t.status !== "finished") ??
      null
    );
  }, [tables, authUser]);

  async function saveProfile(p: { name: string; city: string; age: number; email: string; uid: string }) {
    await upsertUserProfile({
      uid: p.uid,
      name: p.name,
      email: p.email,
      city: p.city,
      age: p.age,
    });
    setProfile({
      uid: p.uid,
      name: p.name,
      email: p.email,
      city: p.city,
      age: p.age,
      isOnline: true,
      lastActivity: Date.now(),
      createdAt: Date.now(),
    });
  }

  async function signOut() {
    await fbSignOut();
  }

  async function createTable(p: { kind: "free" | "bet"; betAmount?: number }) {
    if (!authUser || !profile) throw new Error("Faça login e complete o perfil");
    const newTable = await fbCreateTable({
      createdByUid: authUser.uid,
      createdByName: profile.name,
      createdByCity: profile.city,
      createdByAge: profile.age,
      kind: p.kind,
      betAmount: p.betAmount,
    });
    // Automaticamente entra na mesa criada
    setCurrentTable(newTable);
  }

  async function joinTable(tableId: string) {
    if (!authUser || !profile) throw new Error("Faça login e complete o perfil");
    await fbJoinTable(tableId, authUser.uid, profile.name);
    // Busca a mesa atualizada e seta como currentTable
    const joinedTable = tables.find(t => t.id === tableId);
    if (joinedTable) {
      setCurrentTable({
        ...joinedTable,
        status: "playing",
        opponentUid: authUser.uid,
        opponentName: profile.name,
      });
    }
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

  const auth: AuthState = useMemo(() => ({
    user: profile ? { 
      id: profile.uid, 
      name: profile.name, 
      email: profile.email, 
      city: profile.city, 
      age: profile.age 
    } : null,
    loading: false,
  }), [profile]);

  const logout = async () => {
    setCurrentTable(null);
    await fbSignOut();
  };

  const value: GameContextValue = {
    authUser,
    profile,
    tables,
    onlineUsers,
    activeTable,
    // Compat API
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
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame deve ser usado dentro de GameProvider");
  return ctx;
}
