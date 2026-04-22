import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, getTokens, setTokens, clearTokens } from "@/lib/api";

export type AuthProvider = "google" | "phone";

export type User = {
  id: string;
  username: string | null;     // null until profile setup complete
  displayName: string | null;
  email: string | null;
  phone: string | null;
  photoURL: string | null;
  provider: AuthProvider;
  profileComplete: boolean;    // false until username chosen
  city: string | null;
  bio: string | null;
  vibes: string[];
};

type OtpState = "idle" | "sending" | "sent" | "verifying" | "error";

type Ctx = {
  user: User | null;
  isAuthed: boolean;
  otpState: OtpState;
  otpError: string | null;
  /** Trigger the auth gate sheet from anywhere */
  requireAuth: (reason?: string) => void;
  authReason: string | null;
  authGateOpen: boolean;
  setAuthGateOpen: (v: boolean) => void;
  /** Mock: replace body with real Firebase signInWithPopup */
  signInWithGoogle: () => Promise<void>;
  /** Step 1: send OTP to phone number (e164 format: +447911123456) */
  sendOtp: (phone: string) => Promise<void>;
  /** Step 2: verify the OTP code */
  verifyOtp: (phone: string, code: string) => Promise<void>;
  /** Save profile setup data */
  updateProfile: (patch: Partial<Pick<User, "username" | "displayName" | "bio" | "city" | "vibes">>) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

const USER_KEY = "sektion.user.v1";

/* ── helpers ─────────────────────────────────────────── */
function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function apiUserToUser(u: Record<string, unknown>): User {
  return {
    id:              String(u._id ?? u.id ?? ""),
    username:        (u.username as string) ?? null,
    displayName:     (u.displayName as string) ?? null,
    email:           (u.email as string) ?? null,
    phone:           (u.phone as string) ?? null,
    photoURL:        (u.photoURL as string) ?? null,
    provider:        (u.provider as AuthProvider) ?? "google",
    profileComplete: Boolean(u.profileComplete),
    city:            (u.city as string) ?? null,
    bio:             (u.bio as string) ?? null,
    vibes:           (u.vibes as string[]) ?? [],
  };
}

/* ── Provider ────────────────────────────────────────── */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(loadUser);
  const [otpState, setOtpState] = useState<OtpState>("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);

  // Persist user
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // On mount, validate stored tokens and hydrate user
  useEffect(() => {
    const tokens = getTokens();
    if (!tokens) return;
    api.get<Record<string, unknown>>("/api/users/me")
      .then((u) => setUser(apiUserToUser(u)))
      .catch(() => {
        clearTokens();
        setUser(null);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireAuth = useCallback((reason?: string) => {
    setAuthReason(reason ?? null);
    setAuthGateOpen(true);
  }, []);

  /* ── Google OAuth ─────────────────────────────────── */
  const signInWithGoogle = useCallback(async () => {
    // AuthGate sets window.__googleIdToken to the Google access token from useGoogleLogin
    const googleToken: string | undefined = (window as Window & { __googleIdToken?: string }).__googleIdToken;
    if (!googleToken) throw new Error("No Google token — call useGoogleLogin first");

    const data = await api.post<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>(
      "/api/auth/google",
      { accessToken: googleToken }
    );
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(apiUserToUser(data.user));
    setAuthGateOpen(false);
  }, []);

  /* ── Phone OTP ───────────────────────────────────── */
  const sendOtp = useCallback(async (phone: string) => {
    setOtpState("sending");
    setOtpError(null);
    try {
      await api.post("/api/auth/send-otp", { phone });
      setOtpState("sent");
    } catch (err: unknown) {
      setOtpState("error");
      setOtpError(err instanceof Error ? err.message : "Failed to send code.");
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    setOtpState("verifying");
    setOtpError(null);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>(
        "/api/auth/verify-otp",
        { phone, code }
      );
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setUser(apiUserToUser(data.user));
      setOtpState("idle");
      setAuthGateOpen(false);
    } catch (err: unknown) {
      setOtpState("error");
      setOtpError(err instanceof Error ? err.message : "Invalid code.");
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, "username" | "displayName" | "bio" | "city" | "vibes">>) => {
      try {
        const updated = await api.patch<Record<string, unknown>>("/api/users/me", patch);
        setUser(apiUserToUser(updated));
      } catch {
        // Optimistic update for offline resilience
        setUser((u) =>
          u ? { ...u, ...patch, profileComplete: !!(patch.username ?? u.username) } : u
        );
      }
    },
    []
  );

  const signOut = useCallback(() => {
    const tokens = getTokens();
    if (tokens?.refreshToken) {
      api.post("/api/auth/logout", { refreshToken: tokens.refreshToken }).catch(() => {});
    }
    clearTokens();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setOtpState("idle");
    setOtpError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthed: !!user,
        otpState,
        otpError,
        requireAuth,
        authReason,
        authGateOpen,
        setAuthGateOpen,
        signInWithGoogle,
        sendOtp,
        verifyOtp,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
