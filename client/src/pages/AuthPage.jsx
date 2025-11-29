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
  const {loginUser,signupUser}=useAuth();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    if (mode === "login") {
      loginUser(payload.email, payload.password);
    } else {
      signupUser(payload.name, payload.email, payload.password);
    }
    console.log(`${mode.toUpperCase()} with email/password:`, payload);
    // TODO: hook to your backend / firebase / supabase
  };

  const handleGoogle = () => {
    console.log("Google auth clicked");
    // TODO: integrate Google OAuth
  };

  const handleMobile = () => {
    console.log("Continue with mobile clicked");
    // TODO: open mobile OTP flow
  };

  useEffect(()=>{
    const testAuth = async()=>{
      try{
        const response = await authApi.get('/');
        console.log("Authenticated user:",response.data?.message);
      }catch(err){
        console.log("Not authenticated",err.response?.data || err.message);
      }
    };
    testAuth();
  },[])

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
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-medium px-4 py-2.5 mt-1 hover:opacity-90 transition"
            >
              {isLogin ? "Login to your account" : "Create account"}
              <ArrowRight className="h-3.5 w-3.5" />
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
            src="https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg"
            alt="Mumma's Bite chocolates"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/40 to-bg/20" />

          {/* content on top */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent text-[0.7rem] font-medium">
                🍫 Mumma’s Bite
              </div>
              <h2 className="font-display text-2xl text-text">
                Sign in to your<br /> comfort dessert zone
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
    </main>
  );
}
