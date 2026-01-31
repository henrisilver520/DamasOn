export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  city: string;
  age: number;
  isOnline: boolean;
  lastActivity?: number; // epoch ms
  createdAt?: number;
};

export type TableKind = "free" | "bet";
export type TableStatus = "waiting" | "playing" | "canceled" | "finished";

export type TableDoc = {
  id: string;
  createdAt: number;
  createdByUid: string;
  createdByName: string;
  createdByCity?: string;
  createdByAge?: number;
  kind: TableKind;
  betAmount?: number;
  status: TableStatus;
  opponentUid?: string;
  opponentName?: string;
};

// Alias for compatibility
export type Table = TableDoc;
