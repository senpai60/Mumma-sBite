import { useState } from "react";
import {
  Mail,
  Phone,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  Chrome,
} from "lucide-react";
import LoaderPrimary from "../components/ui/LoaderPrimary.jsx";
import { authApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
// import { ThemeToggle } from "../components/ui/ThemeToggle"; // if you want theme toggle here

function InputField({ label, type = "text", icon: Icon, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-xs sm:text-sm font-sans text-text">
      <span className="flex items-center gap-1.5 text-[0.75rem] text-text-light">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl bg-bg border border-border px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/60 transition">
        {Icon && (
          <span className="text-text-light">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          type={type}
          className="w-full bg-transparent outline-none text-xs sm:text-sm text-text placeholder:text-text-light/60"
          {...props}
        />
      </div>
    </label>
  );
}

function SocialButton({ icon: Icon, label, onClick, variant = "normal" }) {
  const base =
    "w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-primary text-white border-primary hover:opacity-90"
      : "bg-bg text-text border-border hover:border-primary-soft";

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function AuthTabs({ mode, setMode }) {
  return (
    <div className="inline-flex items-center rounded-full bg-bg border border-border p-1 text-xs sm:text-sm">
      <button
        type="button"
        onClick={() => setMode("login")}
        className={`px-4 py-1.5 rounded-full transition ${
          mode === "login"
            ? "bg-primary text-white"
            : "text-text-light hover:text-text"
        }`}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => setMode("signup")}
        className={`px-4 py-1.5 rounded-full transition ${
          mode === "signup"
            ? "bg-primary text-white"
            : "text-text-light hover:text-text"
        }`}
      >
        Sign up
      </button>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const { loginUser, signupUser, loading, googleLogin, sendOtp, verifyOtp } = useAuth();

  // OTP modal state
  const [otpStep, setOtpStep] = useState(null); // null | "phone" | "otp"
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    if (mode === "login") {
      loginUser(payload.email, payload.password);
    } else {
      signupUser(payload.name, payload.email, payload.password);
    }
  };

  const handleGoogle = () => googleLogin();

  const handleMobile = () => {
    setOtpStep("phone");
    setOtpPhone("");
    setOtpCode("");
    setOtpName("");
    setOtpError("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const digits = otpPhone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setOtpError("Enter a valid 10-digit mobile number.");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      await sendOtp(digits);
      setOtpStep("otp");
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setOtpError("Enter the 6-digit OTP sent to your phone.");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyOtp(otpPhone.replace(/\D/g, ""), otpCode, otpName);
      setOtpStep(null);
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    const testAuth = async () => {
      try {
        const response = await authApi.get("/");
        console.log("Authenticated user:", response.data?.message);
      } catch (err) {
        console.log("Not authenticated", err.response?.data || err.message);
      }
    };
    testAuth();
  }, []);

  const isLogin = mode === "login";

  return (
    <main className="bg-bg text-text min-h-screen flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-5xl rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-soft)] overflow-hidden grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
        {/* LEFT: FORM */}
        <div className="p-5 sm:p-7 lg:p-8 flex flex-col gap-6">
          {/* Top meta / back + tabs */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[0.7rem] text-text-light hover:text-primary transition"
              onClick={() => {
                // TODO: navigate("/") if using react-router
                console.log("Back to home");
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </button>

            {/* <ThemeToggle />  // if you want theme toggle here */}
          </div>

          <div className="space-y-3">
            <AuthTabs mode={mode} setMode={setMode} />
            <div className="space-y-1">
              <h1 className="font-display text-xl sm:text-2xl">
                {isLogin ? "Welcome back" : "Join Mumma’s Bite"}
              </h1>
              <p className="font-sans text-[0.75rem] sm:text-xs text-text-light max-w-md">
                {isLogin
                  ? "Login to track your orders, manage favourites and repeat your go-to cravings in one tap."
                  : "Create an account to save your favourites, addresses and make gifting ridiculously easy."}
              </p>
            </div>
          </div>

          {/* Social options */}
          <div className="space-y-2">
            <SocialButton
              icon={Chrome}
              label={isLogin ? "Continue with Google" : "Sign up with Google"}
              onClick={handleGoogle}
            />
            <SocialButton
              icon={Phone}
              label="Continue with mobile number"
              onClick={handleMobile}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[0.7rem] text-text-light">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {!isLogin && (
              <InputField
                name="name"
                label="Full name"
                icon={User}
                placeholder="Enter your name"
                required
              />
            )}

            <InputField
              name="email"
              type="email"
              label="Email address"
              icon={Mail}
              placeholder="you@example.com"
              required
            />

            {!isLogin && (
              <InputField
                name="phone"
                type="tel"
                label="Mobile number (for updates)"
                icon={Phone}
                placeholder="+91 XXXXX XXXXX"
              />
            )}

            <InputField
              name="password"
              type="password"
              label={isLogin ? "Password" : "Create password"}
              icon={Lock}
              placeholder="••••••••"
              required
            />

            {/* Extra row: remember / forgot */}
            {isLogin && (
              <div className="flex items-center justify-between text-[0.7rem] text-text-light">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-3.5 w-3.5 rounded border-border bg-bg"
                  />
                  <span>Keep me logged in</span>
                </label>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => console.log("Forgot password clicked")}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-medium px-4 py-2.5 mt-1 transition
    ${loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
            >
              {loading ? (
                <>
                  <LoaderPrimary className="h-4 w-4" />
                  <span>
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </span>
                </>
              ) : (
                <>
                  {isLogin ? "Login to your account" : "Create account"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            {!isLogin && (
              <p className="text-[0.65rem] text-text-light">
                By creating an account, you agree to our{" "}
                <span className="text-primary cursor-pointer">
                  Terms & Privacy
                </span>
                .
              </p>
            )}
          </form>
        </div>

        {/* RIGHT: ILLUSTRATION SIDE */}
        <div className="hidden lg:block relative bg-bg border-l border-border">
          {/* background image */}
          <img
            src="/images/auth-img.png"
            alt="Mumma's Bite chocolates"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
          />
          {/* gradient overlay — strong from bottom, clear at top */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />

          {/* content — all anchored to the bottom */}
          <div className="relative z-10 h-full flex flex-col justify-end gap-4 p-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent text-[0.7rem] font-medium">
                🍫 Mumma's Bite
              </div>
              <h2 className="font-display text-2xl text-text">
                Sign in to your
                <br /> comfort dessert zone
              </h2>
              <p className="font-sans text-xs text-text-light max-w-xs">
                Save your favourites, repeat last orders in seconds, and never
                forget that one box everybody loved.
              </p>
            </div>

            <div className="space-y-2 text-[0.7rem] text-text-light">
              <p>Why create an account?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>One-tap re-ordering of your usual picks</li>
                <li>Save multiple addresses for easy gifting</li>
                <li>Exclusive drops for members only</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl px-6 py-4 flex flex-col items-center gap-2 shadow-lg">
            <LoaderPrimary className="h-6 w-6" />
            <p className="text-xs text-text-light">Please wait, processing…</p>
          </div>
        </div>
      )}

      {/* ── OTP Modal ─────────────────────────────────────────── */}
      {otpStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-6 shadow-xl flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg text-text">
                  {otpStep === "phone" ? "Enter your mobile" : "Enter OTP"}
                </h2>
                <p className="text-[0.72rem] text-text-light mt-0.5">
                  {otpStep === "phone"
                    ? "We'll send a 6-digit OTP to verify your number."
                    : `OTP sent to +91 ${otpPhone}. Check your messages.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtpStep(null)}
                className="text-text-light hover:text-text text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Step 1 — Phone */}
            {otpStep === "phone" && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <InputField
                  label="Mobile number"
                  type="tel"
                  icon={Phone}
                  placeholder="10-digit number (e.g. 9876543210)"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  required
                />
                {otpError && <p className="text-[0.72rem] text-red-500">{otpError}</p>}
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-medium px-4 py-2.5 transition hover:opacity-90 disabled:opacity-60"
                >
                  {otpLoading ? <LoaderPrimary className="h-4 w-4" /> : null}
                  {otpLoading ? "Sending…" : "Send OTP"}
                </button>
              </form>
            )}

            {/* Step 2 — OTP + optional name */}
            {otpStep === "otp" && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <InputField
                  label="Your name (for new users)"
                  type="text"
                  icon={User}
                  placeholder="Optional — enter if first time"
                  value={otpName}
                  onChange={(e) => setOtpName(e.target.value)}
                />
                <InputField
                  label="6-digit OTP"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  icon={Lock}
                  placeholder="______"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
                {otpError && <p className="text-[0.72rem] text-red-500">{otpError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setOtpStep("phone"); setOtpError(""); }}
                    className="flex-1 rounded-xl border border-border text-text-light text-sm py-2.5 hover:border-primary transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-medium py-2.5 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {otpLoading ? <LoaderPrimary className="h-4 w-4" /> : null}
                    {otpLoading ? "Verifying…" : "Verify & Login"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[0.7rem] text-text-light hover:text-primary transition text-center"
                >
                  Didn't receive it? Resend OTP
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
