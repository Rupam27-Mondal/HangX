import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  MdAdminPanelSettings, MdRefresh, MdLogout, MdSearch,
  MdDelete, MdEdit, MdCheck, MdClose, MdExpandMore, MdExpandLess,
  MdMessage, MdPeople, MdRoom, MdKey, MdVisibility, MdVisibilityOff,
} from "react-icons/md";
import {
  getAdminToken, setAdminToken,
  adminListRoomsApi, adminGetRoomApi,
  adminUpdateRoomApi, adminDeleteRoomApi, adminDeleteMessageApi,
} from "../services/RoomService";
import { timeAgo, avatarUrl, userColor } from "../config/helper";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const StatCard = ({ icon, label, value, color }) => (
  <div
    className="rounded-2xl p-5 flex items-center gap-4"
    style={{ background: "var(--surface-2)", border: "1px solid var(--border-muted)" }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

/* ─── Inline editable field ───────────────────────────────────────────────── */
const EditField = ({ label, value, onSave, placeholder, mono }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = label.toLowerCase().includes("password");

  async function handleSave() {
    if (!draft.trim()) return;
    setLoading(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 group">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">{label}</p>
          <p
            className={`text-sm font-semibold truncate ${mono ? "font-mono" : ""}`}
            style={{
              color: "var(--color-brand-400)",
              filter: isPassword && !showPwd ? "blur(4px)" : "none",
              userSelect: isPassword && !showPwd ? "none" : "text",
            }}
          >
            {value || "—"}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPassword && (
            <button
              onClick={() => setShowPwd((v) => !v)}
              className="btn-icon w-7 h-7"
              style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
            >
              {showPwd ? <MdVisibilityOff size={13} className="text-gray-500" /> : <MdVisibility size={13} className="text-gray-500" />}
            </button>
          )}
          <button
            onClick={() => { setDraft(value || ""); setEditing(true); }}
            className="btn-icon w-7 h-7"
            style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
            title={`Edit ${label}`}
          >
            <MdEdit size={13} className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          className="input-hx flex-1 rounded-lg px-3 py-1.5 text-sm"
          style={{ fontFamily: mono ? "monospace" : undefined }}
          placeholder={placeholder}
          type={isPassword ? "text" : "text"}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-icon w-7 h-7 flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          {loading ? <Spinner /> : <MdCheck size={14} className="text-green-400" />}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="btn-icon w-7 h-7 flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <MdClose size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
};

/* ─── Delete confirm button ───────────────────────────────────────────────── */
const DeleteBtn = ({ label, onConfirm, small }) => {
  const [armed,   setArmed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const size = small ? "text-[11px] px-2 py-1" : "text-xs px-3 py-1.5";

  async function handleClick() {
    if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return; }
    setLoading(true);
    try { await onConfirm(); }
    finally { setLoading(false); setArmed(false); }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 rounded-lg font-semibold transition-all duration-200 ${size}`}
      style={
        armed
          ? { background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.45)", color: "#f87171" }
          : { background: "var(--surface-4)", border: "1px solid var(--border-muted)", color: "rgba(180,185,220,0.6)" }
      }
    >
      {loading ? <Spinner /> : <MdDelete size={small ? 12 : 14} />}
      {armed && !loading ? "Sure?" : label}
    </button>
  );
};

/* ─── Message row inside room detail ─────────────────────────────────────── */
const MessageRow = ({ message, roomId, onDeleted }) => {
  const color  = userColor(message.sender);
  const avatar = avatarUrl(message.sender);

  async function handleDelete() {
    await adminDeleteMessageApi(roomId, message.messageId);
    toast.success("Message deleted");
    onDeleted(message.messageId);
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl group hover:bg-white/5 transition-colors"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
        <img src={avatar} alt={message.sender} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-bold" style={{ color }}>{message.sender}</span>
          <span className="text-[10px] text-gray-600">{timeAgo(message.timeStamp)}</span>
        </div>
        <p className="text-sm text-gray-300 break-words">{message.content}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <DeleteBtn label="Del" onConfirm={handleDelete} small />
      </div>
    </div>
  );
};

/* ─── Room card ───────────────────────────────────────────────────────────── */
const RoomCard = ({ room, onDeleted, onUpdated }) => {
  const [expanded, setExpanded]   = useState(false);
  const [detail,   setDetail]     = useState(null);   // RoomDetail
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadDetail() {
    if (detail) { setExpanded((v) => !v); return; }
    setExpanded(true);
    setLoadingDetail(true);
    try {
      const d = await adminGetRoomApi(room.roomId);
      setDetail(d);
    } catch {
      toast.error("Could not load room detail");
      setExpanded(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRename(newRoomId) {
    try {
      const updated = await adminUpdateRoomApi(room.roomId, newRoomId, undefined);
      toast.success(`Renamed to "${updated.roomId}"`);
      onUpdated(room.roomId, updated);
      // Reload detail with new roomId
      const d = await adminGetRoomApi(updated.roomId);
      setDetail(d);
    } catch (err) {
      toast.error(err.response?.data || "Rename failed");
      throw err;
    }
  }

  async function handlePasswordReset(newPassword) {
    try {
      await adminUpdateRoomApi(room.roomId, undefined, newPassword);
      toast.success("Password updated");
    } catch (err) {
      toast.error("Password update failed");
      throw err;
    }
  }

  async function handleDeleteRoom() {
    await adminDeleteRoomApi(room.roomId);
    toast.success(`Room "${room.roomId}" deleted`);
    onDeleted(room.roomId);
  }

  function handleMessageDeleted(messageId) {
    setDetail((prev) =>
      prev ? { ...prev, messages: prev.messages.filter((m) => m.messageId !== messageId), messageCount: prev.messageCount - 1 } : prev
    );
  }

  const currentRoomId = detail?.roomId ?? room.roomId;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border-muted)" }}
    >
      {/* ── Card header ─────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* room icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
          >
            #
          </div>

          {/* info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3
                className="font-bold text-base truncate"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-brand-400)" }}
              >
                #{currentRoomId}
              </h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--surface-5)", color: "var(--color-brand-400)", border: "1px solid var(--border-muted)" }}
              >
                {room.messageCount} msg{room.messageCount !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-mono">id: {room.id}</p>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <DeleteBtn label="Delete Room" onConfirm={handleDeleteRoom} />
            <button
              onClick={loadDetail}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)", color: "rgba(180,185,220,0.7)" }}
            >
              {expanded ? <MdExpandLess size={15} /> : <MdExpandMore size={15} />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {/* inline edit fields */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <EditField
            label="Room ID"
            value={currentRoomId}
            onSave={handleRename}
            placeholder="new-room-id"
          />
          <EditField
            label="Reset Password"
            value=""
            onSave={handlePasswordReset}
            placeholder="new password"
            mono
          />
        </div>
      </div>

      {/* ── Expanded message list ──────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-sm">
              <Spinner /> Loading messages…
            </div>
          ) : detail?.messages?.length > 0 ? (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="px-4 py-2 flex items-center gap-2"
                style={{ background: "var(--surface-1)" }}>
                <MdMessage size={13} className="text-gray-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  Messages ({detail.messages.length})
                </span>
              </div>
              <div
                className="max-h-72 overflow-y-auto"
                style={{ background: "var(--surface-1)" }}
              >
                {detail.messages.map((msg) => (
                  <MessageRow
                    key={msg.messageId}
                    message={msg}
                    roomId={currentRoomId}
                    onDeleted={handleMessageDeleted}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-gray-600"
              style={{ background: "var(--surface-1)" }}>
              No messages in this room
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main AdminDashboard ─────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  // Guard — redirect to home if no admin token
  useEffect(() => {
    if (!getAdminToken()) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, []);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListRoomsApi();
      setRooms(data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired — please log in again");
        setAdminToken(null);
        navigate("/");
      } else {
        toast.error("Could not load rooms");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  function handleLogout() {
    setAdminToken(null);
    toast("Logged out of admin panel", { icon: "👋" });
    navigate("/");
  }

  function handleRoomDeleted(roomId) {
    setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
  }

  function handleRoomUpdated(oldRoomId, updated) {
    setRooms((prev) =>
      prev.map((r) => r.roomId === oldRoomId ? { ...r, roomId: updated.roomId } : r)
    );
  }

  const filtered = rooms.filter((r) =>
    r.roomId.toLowerCase().includes(search.toLowerCase())
  );

  const totalMessages = rooms.reduce((s, r) => s + r.messageCount, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-6 py-4"
        style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border-subtle)", backdropFilter: "blur(12px)" }}
      >
        {/* brand */}
        <div className="flex items-center gap-3 mr-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: "linear-gradient(135deg,#d97706,#b45309)",
              boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
            }}
          >
            🛡️
          </div>
          <div>
            <h1
              className="font-bold text-base leading-none"
              style={{ fontFamily: "var(--font-display)", color: "#fbbf24" }}
            >
              Admin Panel
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">HangX Dashboard</p>
          </div>
        </div>

        {/* search */}
        <div
          className="flex items-center gap-2 flex-1 max-w-sm rounded-xl px-3 py-2"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}
        >
          <MdSearch size={16} className="text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: "#e8eaf6" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-600 hover:text-gray-400">
              <MdClose size={14} />
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* actions */}
        <button
          onClick={loadRooms}
          disabled={loading}
          className="btn-icon w-9 h-9"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}
          title="Refresh"
        >
          <MdRefresh size={17} className={`text-gray-400 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all btn-danger"
        >
          <MdLogout size={15} />
          Logout
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon="🏠" label="Total Rooms"    value={rooms.length}  color="#6b8eff" />
          <StatCard icon="💬" label="Total Messages" value={totalMessages} color="#a78bfa" />
          <StatCard icon="🔍" label="Filtered"       value={filtered.length} color="#34d399" />
        </div>

        {/* ── Rooms list ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: "var(--font-display)", color: "#e8eaf6" }}
          >
            All Rooms
            {search && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <span className="text-xs text-gray-600">{rooms.length} total</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner />
            <p className="text-sm text-gray-600">Loading rooms…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-muted)" }}
          >
            <span className="text-4xl">🏚️</span>
            <p className="text-sm text-gray-500">
              {search ? `No rooms matching "${search}"` : "No rooms found"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onDeleted={handleRoomDeleted}
                onUpdated={handleRoomUpdated}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
