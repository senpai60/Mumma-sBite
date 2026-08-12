import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Edit3,
  ShieldCheck,
  Bell,
  Moon,
  SunMedium,
  Package,
  Heart,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function ProfileSectionCard({ title, description, children, rightSlot }) {
  return (
    <section className="bg-surface border border-border rounded-[var(--radius-card)] p-4 sm:p-5 shadow-[var(--shadow-soft)] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm sm:text-base text-text">
            {title}
          </h2>
          {description && (
            <p className="font-sans text-[0.7rem] sm:text-xs text-text-light">
              {description}
            </p>
          )}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function ProfileAvatar({ name }) {
  // SAFE: even if name is undefined/null/empty
  const safeName =
    typeof name === "string" && name.trim().length > 0
      ? name
      : "Mummas Bite User";

  const initials = safeName
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="relative inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-accent-soft text-accent font-display text-xl sm:text-2xl border border-border">
      {initials || "MB"}
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-bg border border-border text-[0.7rem] text-text-light font-medium">
      {children}
    </span>
  );
}

function ToggleChip({ label, active, onToggle, icon }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[0.7rem] sm:text-xs font-medium transition-colors ${
        active
          ? "bg-primary-soft border-primary text-primary"
          : "bg-bg border-border text-text-light hover:border-primary-soft"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-sans">
      <div className="inline-flex items-center gap-2 text-text-light">
        {Icon && (
          <span className="h-7 w-7 rounded-full bg-bg border border-border flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-text-light" />
          </span>
        )}
        <span>{label}</span>
      </div>
      <span className="text-text font-medium">{value || "Not added"}</span>
    </div>
  );
}

function AddressCard({ address, isDefault }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-bg border border-border px-3 py-3">
      <div className="flex gap-2">
        <div className="mt-0.5">
          <MapPin className="h-4 w-4 text-accent" />
        </div>
        <div className="space-y-1">
          <p className="font-sans text-xs sm:text-sm text-text">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </p>
          <p className="font-sans text-[0.7rem] text-text-light">
            {address.city}, {address.state} · {address.pincode}
          </p>
          {isDefault && (
            <span className="inline-flex items-center text-[0.65rem] text-accent bg-accent-soft px-2 py-0.5 rounded-full font-medium">
              Default address
            </span>
          )}
        </div>
      </div>

      <button className="text-text-light hover:text-primary text-[0.7rem] flex items-center gap-1">
        <Edit3 className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}

function SmallStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-bg border border-border px-3 py-2">
      <div className="h-8 w-8 rounded-xl bg-primary-soft flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-text-light">{label}</span>
        <span className="text-sm font-semibold text-text">{value}</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [prefTheme, setPrefTheme] = useState("system");
  const [promoEmails, setPromoEmails] = useState(true);
  const [promoWhatsapp, setPromoWhatsapp] = useState(false);

  const { user, logoutUser, updateUser, sendOtp, loading } = useAuth(); // assume null/undefined initially allowed

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editStep, setEditStep] = useState("details"); // "details" | "verify-phone"
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setOtpCode("");
    setEditStep("details");
    setSaveError("");
    setSaveSuccess("");
    setIsEditing(true);
  };

  const isPhoneChanged =
    formData.phone && formData.phone.trim() !== (user?.phone || "").trim();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    // If phone number was changed and we're still on details step, require OTP verification first
    if (isPhoneChanged && editStep === "details") {
      const cleaned = formData.phone.replace(/\D/g, "");
      if (cleaned.length !== 10) {
        setSaveError("Please enter a valid 10-digit mobile number.");
        return;
      }

      setSaving(true);
      try {
        await sendOtp(cleaned);
        setEditStep("verify-phone");
        setSaveSuccess(`OTP sent to +91 ${cleaned} via WhatsApp / SMS!`);
      } catch (err) {
        setSaveError(
          err.response?.data?.message || "Failed to send OTP. Please try again."
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    // Final save (either phone didn't change, or OTP step completed)
    setSaving(true);
    try {
      const payload = {
        ...formData,
        ...(isPhoneChanged ? { otp: otpCode } : {}),
      };
      await updateUser(payload);
      setSaveSuccess("Profile updated successfully!");
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess("");
        setEditStep("details");
        setOtpCode("");
      }, 1200);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addresses = [
    {
      id: 1,
      line1: user?.address || "201, Shanti Nagar",
      line2: "Near City Garden",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452001",
      isDefault: true,
    },
    {
      id: 2,
      line1: "House 14, Maple Residency",
      line2: "",
      city: "Bhopal",
      state: "Madhya Pradesh",
      pincode: "462001",
      isDefault: false,
    },
  ];

  const quickStats = {
    orders: 23,
    favorites: 9,
    thisMonth: "₹3,250",
  };

  const lastOrders = [
    {
      id: "ORD-2401",
      title: "Mumma’s Signature Box",
      date: "24 Nov, 2025",
      amount: "₹699",
      status: "Delivered",
    },
    {
      id: "ORD-2394",
      title: "Dark Collection + Brownies",
      date: "18 Nov, 2025",
      amount: "₹1,249",
      status: "Delivered",
    },
  ];

  const handleLogout = async () => {
    await logoutUser();
  };
  return (
    <main className="bg-bg text-text min-h-[70vh] px-4 py-8 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top: avatar + basic info */}
        <section className="bg-surface border border-border rounded-[var(--radius-card)] p-4 sm:p-5 md:p-6 shadow-[var(--shadow-soft)] flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <ProfileAvatar name={user?.name} />
            <div className="space-y-2">
              <div>
                <h1 className="font-display text-lg sm:text-xl text-text">
                  {user?.name || "Guest User"}
                </h1>
                <p className="font-sans text-[0.75rem] sm:text-xs text-text-light">
                  Loves dark chocolate & gooey brownies 🍫
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill>Member since {user?.joined || "Recently"}</Pill>
                <Pill>Tier: {user?.tier || "Regular"}</Pill>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex gap-2">
              <button 
                onClick={openEditModal}
                className="px-3 py-1.5 rounded-lg bg-bg border border-border text-xs sm:text-sm font-medium hover:border-primary transition"
              >
                Edit profile
              </button>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1">
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
            <span className="text-[0.65rem] text-text-light">
              Manage your details, addresses & preferences here.
            </span>
          </div>
        </section>

        {/* Middle: grid */}
        <div className="grid gap-5 lg:grid-cols-[2fr_1.5fr]">
          {/* Left column */}
          <div className="space-y-4">
            {/* Contact details */}
            <ProfileSectionCard
              title="Contact details"
              description="We’ll use this to send order updates and important info."
              rightSlot={
                <button 
                  onClick={openEditModal}
                  className="text-[0.7rem] text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
              }
            >
              <div className="space-y-2">
                <InfoRow icon={Mail} label="Email" value={user?.email} />
                <InfoRow icon={Phone} label="Phone" value={user?.phone} />
              </div>
            </ProfileSectionCard>

            {/* Addresses */}
            <ProfileSectionCard
              title="Saved addresses"
              description="Choose from your saved locations at checkout."
              rightSlot={
                <button className="text-[0.7rem] text-primary inline-flex items-center gap-1">
                  + Add new
                </button>
              }
            >
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    isDefault={addr.isDefault}
                  />
                ))}
              </div>
            </ProfileSectionCard>

            {/* Preferences */}
            <ProfileSectionCard
              title="Preferences"
              description="Fine-tune how you like to shop and get notified."
            >
              <div className="space-y-3">
                {/* Theme preference */}
                <div className="space-y-1.5">
                  <p className="font-sans text-[0.75rem] text-text-light">
                    Theme
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip
                      label="Light"
                      icon={SunMedium}
                      active={prefTheme === "light"}
                      onToggle={() => setPrefTheme("light")}
                    />
                    <ToggleChip
                      label="Dark"
                      icon={Moon}
                      active={prefTheme === "dark"}
                      onToggle={() => setPrefTheme("dark")}
                    />
                    <ToggleChip
                      label="System default"
                      active={prefTheme === "system"}
                      onToggle={() => setPrefTheme("system")}
                    />
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-1.5">
                  <p className="font-sans text-[0.75rem] text-text-light">
                    Notifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip
                      label="Promos on email"
                      icon={Bell}
                      active={promoEmails}
                      onToggle={() => setPromoEmails((p) => !p)}
                    />
                    <ToggleChip
                      label="Order updates on WhatsApp"
                      active={promoWhatsapp}
                      onToggle={() => setPromoWhatsapp((p) => !p)}
                    />
                  </div>
                </div>
              </div>
            </ProfileSectionCard>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick stats */}
            <ProfileSectionCard
              title="Quick overview"
              description="Your recent activity with Mumma’s Bite."
            >
              <div className="grid grid-cols-2 gap-2">
                <SmallStat
                  icon={Package}
                  label="Total orders"
                  value={quickStats.orders}
                />
                <SmallStat
                  icon={Heart}
                  label="Favourites"
                  value={quickStats.favorites}
                />
                <SmallStat
                  icon={Package}
                  label="This month spent"
                  value={quickStats.thisMonth}
                />
                <SmallStat icon={ShieldCheck} label="Account" value="Secure" />
              </div>
            </ProfileSectionCard>

            {/* Recent orders preview */}
            <ProfileSectionCard
              title="Recent orders"
              description="Last few things you enjoyed."
              rightSlot={
                <button className="text-[0.7rem] text-primary inline-flex items-center gap-1">
                  View all
                  <ChevronRight className="h-3 w-3" />
                </button>
              }
            >
              <div className="space-y-2">
                {lastOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-bg border border-border px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-text">
                        {order.title}
                      </span>
                      <span className="text-[0.7rem] text-text-light">
                        {order.date} · {order.status}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-text">
                      {order.amount}
                    </span>
                  </div>
                ))}
              </div>
            </ProfileSectionCard>

            {/* Security / account */}
            <ProfileSectionCard
              title="Security & sign-in"
              description="Basic overview of your account safety."
              rightSlot={
                <button className="text-[0.7rem] text-primary inline-flex items-center gap-1">
                  Manage
                </button>
              }
            >
              <div className="space-y-2 text-[0.75rem] text-text-light">
                <div className="flex items-center justify-between">
                  <span>Login method</span>
                  <span className="font-medium text-text">
                    Email + password
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Two-step verification</span>
                  <span className="font-medium text-text-light">
                    Not enabled
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last active device</span>
                  <span className="font-medium text-text">Chrome · Indore</span>
                </div>
              </div>
            </ProfileSectionCard>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-text">
                  {editStep === "details" ? "Edit Profile" : "Verify Mobile Number"}
                </h2>
                <p className="text-xs text-text-light">
                  {editStep === "details"
                    ? "Update your contact info and default shipping details."
                    : `Enter the 6-digit OTP sent to +91 ${formData.phone}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-text-light hover:text-text text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {saveSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {editStep === "details" ? (
                <>
                  <label className="flex flex-col gap-1 text-xs text-text">
                    <span className="text-text-light">Full Name</span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Enter your name"
                      className="w-full rounded-xl bg-bg border border-border px-3 py-2 text-xs sm:text-sm text-text outline-none focus:border-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-text">
                    <span className="text-text-light">Email Address</span>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-bg border border-border px-3 py-2 text-xs sm:text-sm text-text outline-none focus:border-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-text">
                    <div className="flex items-center justify-between">
                      <span className="text-text-light">Mobile Phone</span>
                      {isPhoneChanged && (
                        <span className="text-[0.65rem] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                          OTP Verification Required
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="10-digit mobile number"
                      className={`w-full rounded-xl bg-bg border px-3 py-2 text-xs sm:text-sm text-text outline-none transition ${
                        isPhoneChanged
                          ? "border-amber-500/50 focus:border-amber-500"
                          : "border-border focus:border-primary"
                      }`}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-text">
                    <span className="text-text-light">Default Address</span>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Street, City, State, Pincode"
                      className="w-full rounded-xl bg-bg border border-border px-3 py-2 text-xs sm:text-sm text-text outline-none focus:border-primary resize-none"
                    />
                  </label>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-xl border border-border text-xs sm:text-sm text-text-light py-2 hover:border-primary transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-primary text-white text-xs sm:text-sm font-medium py-2 transition hover:opacity-90 disabled:opacity-60"
                    >
                      {saving
                        ? "Sending OTP…"
                        : isPhoneChanged
                        ? "Verify Phone & Save"
                        : "Save Changes"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-xs text-text">
                    <span className="text-text-light">6-Digit OTP Code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      required
                      placeholder="______"
                      className="w-full rounded-xl bg-bg border border-primary px-3 py-2.5 text-center font-mono text-base tracking-widest text-text outline-none"
                    />
                  </label>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditStep("details");
                        setSaveError("");
                        setSaveSuccess("");
                      }}
                      className="flex-1 rounded-xl border border-border text-xs sm:text-sm text-text-light py-2 hover:border-primary transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={saving || otpCode.length !== 6}
                      className="flex-1 rounded-xl bg-primary text-white text-xs sm:text-sm font-medium py-2 transition hover:opacity-90 disabled:opacity-60"
                    >
                      {saving ? "Verifying…" : "Verify & Save Profile"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
