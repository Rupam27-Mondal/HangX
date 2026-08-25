import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  MdContentCopy, MdCheck, MdVisibility, MdVisibilityOff,
  MdLock, MdShield, MdAdminPanelSettings,
} from "react-icons/md";
import { createRoomApi, joinChatApi, adminLoginApi, setAdminToken } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import { avatarUrl } from "../config/helper";

/* ─── Floating decorative bubble ─────────────────────────────────────────── */
const FloatingMessage = ({ text, user, right, delay }) => (
  <div
    className={`absolute flex items-end gap-2 animate-float-slow ${right ? "flex-row-reverse" : ""}`}
    style={{ animationDelay: `${delay}s`, opacity: 0.7 }}
  >
    <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden">
      <img src={avatarUrl(user)} alt={user} className="w-full h-full" />
    </div>
    <div
      className={`px-3 py-1.5 text-xs font-medium text-gray-300 max-w-[130px] ${right ? "bubble-self" : "bubble-other"}`}
      style={{
        background: right
          ? "linear-gradient(135deg,rgba(79,110,247,0.22),rgba(139,92,246,0.16))"
          : "var(--surface-4)",
        border: "1px solid var(--border-muted)",
      }}
    >
      {text}
    </div>
  </div>
);

/* ─── Feature chip ────────────────────────────────────────────────────────── */
const Feature = ({ icon, label, desc }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
      style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-200">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

/* ─── Generated-password reveal modal ────────────────────────────────────── */
const PasswordModal = ({ password, roomId, onContinue }) => {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    /* full-screen overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>

      <div className="glass-strong rounded-3xl w-full max-w-md p-8 animate-slide-up shadow-2xl">

        {/* icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: "linear-gradient(135deg,rgba(79,110,247,0.25),rgba(139,92,246,0.2))",
              border: "1px solid rgba(107,142,255,0.3)",
              boxShadow: "0 8px 32px rgba(79,110,247,0.25)",
            }}>
            🔑
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-1"
          style={{ fontFamily: "var(--font-display)" }}>
          Room Created!
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Save this password — it is shown <strong className="text-red-400">only once</strong> and cannot be recovered.
        </p>

        {/* ── Room ID + Password side by side ── */}
        <div className="rounded-2xl p-4 mb-5"
          style={{
            background: "linear-gradient(135deg,rgba(79,110,247,0.10),rgba(139,92,246,0.08))",
            border: "1px solid rgba(107,142,255,0.25)",
          }}>
          <div className="flex items-stretch gap-3">

            {/* Room ID */}
            <div className="flex-1 min-w-0 rounded-xl px-3 py-2.5"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Room ID</p>
              <p className="font-bold text-sm truncate"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-brand-400)" }}>
                #{roomId}
              </p>
            </div>

            {/* divider */}
            <div className="flex items-center text-gray-700 text-lg select-none">+</div>

            {/* Password */}
            <div className="flex-1 min-w-0 rounded-xl px-3 py-2.5"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Password</p>
              <p className="font-bold text-sm truncate font-mono"
                style={{ color: "#a78bfa", letterSpacing: "0.04em" }}>
                {password}
              </p>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="btn-icon flex-shrink-0 self-center w-9 h-9"
              style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
              title={copied ? "Copied!" : "Copy password"}
            >
              {copied
                ? <MdCheck size={16} className="text-green-400" />
                : <MdContentCopy size={16} className="text-gray-400" />}
            </button>
          </div>

          <p className="text-[10px] text-gray-600 mt-3 text-center">
            Share both the Room ID and password with people you want to invite
          </p>
        </div>

        {/* warning */}
        <div className="rounded-xl p-3 mb-6 flex items-start gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs text-red-300">
            This password is not stored anywhere. If you lose it, the room cannot be accessed and will need to be recreated.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="btn-primary w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <MdShield size={16} />
          I've saved it — Enter Room
        </button>
      </div>
    </div>
  );
};

/* ─── Admin login modal ───────────────────────────────────────────────────── */
const AdminLoginModal = ({ onClose }) => {
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) { toast.error("Enter the admin password"); return; }
    setLoading(true);
    try {
      const data = await adminLoginApi(password.trim());
      setAdminToken(data.token);
      toast.success("Welcome, Admin!", { icon: "🛡️" });
      onClose();
      navigate("/admin");
    } catch (err) {
      if (err.response?.status === 401) toast.error("Invalid admin password");
      else toast.error("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-strong rounded-3xl w-full max-w-sm p-8 animate-slide-up shadow-2xl">
        {/* icon */}
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: "linear-gradient(135deg,rgba(251,191,36,0.2),rgba(245,158,11,0.15))",
              border: "1px solid rgba(251,191,36,0.3)",
              boxShadow: "0 8px 32px rgba(251,191,36,0.2)",
            }}
          >
            🛡️
          </div>
        </div>

        <h2
          className="text-xl font-bold text-center mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Admin Login
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Enter the admin password to access the dashboard
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <MdLock size={16} className="absolute left-4 text-gray-500" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPwd ? "text" : "password"}
              placeholder="Admin password"
              autoFocus
              className="input-hx w-full rounded-xl pl-10 pr-11 py-3 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(135deg,#d97706,#b45309)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Verifying…
              </>
            ) : (
              <>
                <MdAdminPanelSettings size={18} />
                Enter Dashboard
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const JoinCreateChat = () => {
  const [detail, setDetail] = useState({ roomId: "", userName: "", password: "" });
  const [mode,    setMode]   = useState("join");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [generatedModal, setGeneratedModal] = useState(null);
  const [pendingNav,     setPendingNav]     = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const { setRoomId, setCurrentUser, setConnected, setRoomToken, setRoomPassword } = useChatContext();
  const navigate = useNavigate();

  const previewAvatar = avatarUrl(detail.userName || "you");

  function handleChange(e) {
    setDetail((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validate() {
    if (!detail.userName.trim()) { toast.error("Please enter your name"); return false; }
    if (!detail.roomId.trim())   { toast.error("Please enter a Room ID"); return false; }
    if (mode === "join" && !detail.password.trim()) {
      toast.error("Please enter the room password");
      return false;
    }
    return true;
  }

  /* store context + session and navigate to chat */
  function enterChat(authResp, plaintextPassword) {
    setRoomToken(authResp.token);
    setCurrentUser(authResp.userName);
    setRoomId(authResp.roomId);
    setRoomPassword(plaintextPassword || "");
    setConnected(true);
    navigate("/chat");
  }

  async function handleCreate() {
    if (!validate()) return;
    setLoading(true);
    try {
      // If user left password blank, pass undefined → server auto-generates
      const pw = detail.password.trim() || undefined;
      const authResp = await createRoomApi(detail.roomId.trim(), detail.userName.trim(), pw);

      if (authResp.generatedPassword) {
        // Show the generated-password modal BEFORE entering the room
        setPendingNav(authResp);
        setGeneratedModal({ password: authResp.generatedPassword, roomId: authResp.roomId });
      } else {
        toast.success(`Room "${authResp.roomId}" created! 🚀`);
        enterChat(authResp, detail.password.trim());
      }
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("A room with that ID already exists");
      } else {
        toast.error("Could not create room — is the server running?");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const authResp = await joinChatApi(
        detail.roomId.trim(),
        detail.userName.trim(),
        detail.password.trim()
      );
      toast.success(`Joined room "${authResp.roomId}" 🎉`);
      enterChat(authResp, detail.password.trim());
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Incorrect password");
      } else if (err.response?.status === 404) {
        toast.error("Room not found");
      } else {
        toast.error("Could not join room — is the server running?");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    mode === "join" ? handleJoin() : handleCreate();
  }

  /* User acknowledged the password modal — now navigate into the room */
  function handleModalContinue() {
    setGeneratedModal(null);
    if (pendingNav) {
      toast.success(`Room "${pendingNav.roomId}" created! 🚀`);
      enterChat(pendingNav, pendingNav.generatedPassword);
      setPendingNav(null);
    }
  }

  return (
    <>
      {/* ── Admin login modal ────────────────────────────────────────── */}
      {showAdminModal && (
        <AdminLoginModal onClose={() => setShowAdminModal(false)} />
      )}

      {/* ── Generated password modal ─────────────────────────────────── */}
      {generatedModal && (
        <PasswordModal
          password={generatedModal.password}
          roomId={generatedModal.roomId}
          onContinue={handleModalContinue}
        />
      )}

      <div className="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10">

        {/* decorative blobs */}
        <div className="pointer-events-none absolute top-[-180px] left-[-150px] w-[520px] h-[520px] rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle,rgba(79,110,247,0.14) 0%,transparent 70%)", filter: "blur(40px)" }} />
        <div className="pointer-events-none absolute bottom-[-120px] right-[-100px] w-[420px] h-[420px] rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)", filter: "blur(40px)", animationDelay: "1.5s" }} />

        {/* floating decorative messages (desktop only) */}
        <div className="hidden lg:block pointer-events-none absolute inset-0">
          <div className="absolute top-[18%] left-[6%]"><FloatingMessage text="Hey everyone! 👋" user="Alex" delay={0} /></div>
          <div className="absolute top-[34%] left-[4%]"><FloatingMessage text="This is encrypted �" user="Sam" delay={1.2} /></div>
          <div className="absolute top-[52%] left-[7%]"><FloatingMessage text="Just joined the room" user="Mia" delay={2.4} /></div>
          <div className="absolute top-[22%] right-[5%]"><FloatingMessage text="Welcome! 🎉" user="Jordan" right delay={0.6} /></div>
          <div className="absolute top-[40%] right-[4%]"><FloatingMessage text="Share the password 🔑" user="Casey" right delay={1.8} /></div>
          <div className="absolute top-[60%] right-[6%]"><FloatingMessage text="Ultra secure ✨" user="Riley" right delay={3} /></div>
        </div>

        {/* ── Main card ──────────────────────────────────────────────── */}
        <div className="glass-strong rounded-3xl w-full max-w-md p-8 z-10 animate-slide-up shadow-2xl">

          {/* logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
              style={{
                background: "linear-gradient(135deg,var(--color-brand-500),var(--color-accent-500))",
                boxShadow: "0 8px 32px rgba(79,110,247,0.4)",
              }}>
              💬
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
              <span className="gradient-text">HangX</span>
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <MdLock size={13} className="text-green-400" />
              <p className="text-xs text-gray-500">Password-protected rooms</p>
            </div>
          </div>

          {/* mode toggle */}
          <div className="flex rounded-xl p-1 mb-6"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
            {["join", "create"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
                style={
                  mode === m
                    ? { background: "linear-gradient(135deg,var(--color-brand-500),var(--color-brand-600))", color: "#fff", boxShadow: "0 2px 12px rgba(79,110,247,0.35)" }
                    : { color: "rgba(180,185,220,0.6)" }
                }
              >
                {m === "join" ? "🔗  Join Room" : "✨  Create Room"}
              </button>
            ))}
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Your Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                  <img src={previewAvatar} alt="avatar" className="w-full h-full" />
                </div>
                <input
                  name="userName" value={detail.userName} onChange={handleChange}
                  placeholder="e.g. Alex" autoComplete="off"
                  className="input-hx w-full rounded-xl pl-12 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            {/* room ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {mode === "join" ? "Room ID" : "New Room ID"}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-500 text-sm select-none">#</span>
                <input
                  name="roomId" value={detail.roomId} onChange={handleChange}
                  placeholder={mode === "join" ? "Enter room ID" : "Choose a room ID"}
                  autoComplete="off"
                  className="input-hx w-full rounded-xl pl-8 pr-4 py-3 text-sm"
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                {mode === "join" ? "Room Password" : "Room Password (optional)"}
              </label>
              <div className="relative flex items-center">
                <MdLock size={16} className="absolute left-4 text-gray-500 flex-shrink-0" />
                <input
                  name="password" value={detail.password} onChange={handleChange}
                  type={showPwd ? "text" : "password"}
                  placeholder={
                    mode === "join"
                      ? "Enter the room password"
                      : "Leave blank to auto-generate"
                  }
                  autoComplete="new-password"
                  className="input-hx w-full rounded-xl pl-10 pr-11 py-3 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
              {mode === "create" && (
                <p className="mt-1.5 text-xs text-gray-600">
                  If you leave this blank a secure password will be generated and shown to you once.
                </p>
              )}
            </div>

            {/* submit */}
            <button
              type="submit" disabled={loading}
              className="btn-primary rounded-xl py-3 text-sm font-semibold mt-2 w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {mode === "join" ? "Verifying…" : "Creating…"}
                </>
              ) : (
                mode === "join" ? "🔗  Join Room" : "🚀  Create Room"
              )}
            </button>
          </form>

          {/* feature list */}
          <div className="mt-8">
            <div className="divider-label mb-5">Security features</div>
            <div className="flex flex-col gap-4">
              <Feature icon="🔒" label="Password-protected rooms" desc="BCrypt-hashed — never stored in plain text" />
              <Feature icon="🪙" label="JWT session tokens" desc="Room-scoped, expire in 24 h, signed server-side" />
              <Feature icon="⚡" label="Authenticated WebSocket" desc="STOMP CONNECT validated before any message flows" />
              <Feature icon="🎨" label="Unique avatars" desc="Every user gets their own generated avatar" />
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">No account or sign-up required</p>

          {/* ── Admin button ──────────────────────────────────────────── */}
          <div className="flex justify-center mt-5">
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: "rgba(217,119,6,0.10)",
                border: "1px solid rgba(217,119,6,0.25)",
                color: "#fbbf24",
              }}
            >
              <MdAdminPanelSettings size={15} />
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default JoinCreateChat;
