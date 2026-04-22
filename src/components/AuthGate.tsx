import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Loader2, Phone, ArrowLeft, ShieldCheck, Zap, Star } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

/* ── Google G Icon SVG ───────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ── Phone OTP form ──────────────────────────────────── */
function PhoneOtpForm({ onBack }: { onBack: () => void }) {
  const { otpState, otpError, sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState("+44");
  const [code, setCode] = useState("");

  const isLoading = otpState === "sending" || otpState === "verifying";

  const handleSend = () => {
    const clean = phone.replace(/\s/g, "");
    if (clean.length < 8) return;
    sendOtp(clean);
  };

  const handleVerify = () => {
    const clean = phone.replace(/\s/g, "");
    verifyOtp(clean, code);
  };

  return (
    <div className="flex flex-col gap-5 px-5 pb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-muted-foreground self-start hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Other sign-in options
      </button>

      {otpState !== "sent" ? (
        <>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Mobile number
            </label>
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7900 000000"
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
              We'll send a one-time code. Standard rates apply.
            </p>
          </div>
          {otpError && <p className="text-xs text-destructive px-1">{otpError}</p>}
          <button
            disabled={phone.replace(/\s/g, "").length < 8 || isLoading}
            onClick={handleSend}
            className="bg-gradient-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
            Send code
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Enter 6-digit code sent to {phone}
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {otpError && <p className="text-xs text-destructive text-center">{otpError}</p>}
          <button
            disabled={code.length !== 6 || isLoading}
            onClick={handleVerify}
            className="bg-gradient-primary text-primary-foreground flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Verify &amp; Sign in
          </button>
          <button
            onClick={() => sendOtp(phone.replace(/\s/g, ""))}
            className="text-xs text-muted-foreground text-center hover:text-foreground transition-colors"
          >
            Didn't get it? Resend code
          </button>
        </>
      )}
    </div>
  );
}

/* ── Main AuthGate Sheet ─────────────────────────────── */
export function AuthGate() {
  const { authGateOpen, setAuthGateOpen, authReason, signInWithGoogle, otpState } = useAuth();
  const [mode, setMode] = useState<"choose" | "phone">("choose");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setGoogleError(null);
      try {
        // Exchange access token for ID token via userinfo endpoint, then call our backend
        // We use the access token to get user info; backend expects an idToken from google-auth-library
        // Alternative: use flow="auth-code" — but for SPA, we use credential callback via GSI
        // Store access token temporarily; AuthContext.signInWithGoogle reads it
        (window as Window & { __googleIdToken?: string }).__googleIdToken = tokenResponse.access_token;
        await signInWithGoogle();
      } catch (e: unknown) {
        setGoogleError(e instanceof Error ? e.message : "Google sign-in failed");
      } finally {
        setGoogleLoading(false);
        delete (window as Window & { __googleIdToken?: string }).__googleIdToken;
      }
    },
    onError: () => {
      setGoogleLoading(false);
      setGoogleError("Google sign-in was cancelled or failed.");
    },
    flow: "implicit",
  });

  const handleGoogle = () => {
    setGoogleLoading(true);
    setGoogleError(null);
    googleLogin();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setMode("choose");
    setAuthGateOpen(v);
  };

  return (
    <Sheet open={authGateOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] p-0">
        <div className="bg-muted-foreground/40 mx-auto mt-3 h-1 w-12 rounded-full" />

        {/* Hero */}
        <div className="px-5 pt-5 pb-4 text-center">
          <div className="bg-gradient-primary mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-neon">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-black">Join Sektion</h2>
          {authReason ? (
            <p className="text-sm text-muted-foreground mt-1">{authReason}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Book tables, save favourites and connect with your people.
            </p>
          )}
          <div className="mt-3 flex justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent" /> Save favourites</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-accent" /> Secure &amp; private</span>
          </div>
        </div>

        {mode === "choose" ? (
          <div className="flex flex-col gap-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white/5 py-3.5 font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>

            {/* Phone */}
            <button
              onClick={() => setMode("phone")}
              className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white/5 py-3.5 font-bold text-sm hover:bg-white/10 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Continue with mobile number
            </button>

            <p className="text-center text-[11px] text-muted-foreground pb-2 px-2 leading-relaxed">
              By continuing you agree to Sektion's{" "}
              <span className="underline cursor-pointer">Terms</span> and{" "}
              <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        ) : (
          <PhoneOtpForm onBack={() => setMode("choose")} />
        )}
      </SheetContent>
    </Sheet>
  );
}
