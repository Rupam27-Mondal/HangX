import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MdSend, MdContentCopy, MdCheck, MdPeople,
  MdLogout, MdEmojiEmotions, MdDeleteOutline,
  MdVisibility, MdVisibilityOff,
} from "react-icons/md";
import { HiMenuAlt2, HiX } from "react-icons/hi";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess, deleteMessageApi } from "../services/RoomService";
import { timeAgo, formatTimestamp, userColor, avatarUrl } from "../config/helper";

/* ─── Quick-emoji palette ─────────────────────────────────────────────────── */
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "✨"];

/* ─── Typing indicator ────────────────────────────────────────────────────── */
const TypingIndicator = ({ users }) => {
  if (!users.length) return null;
  const label =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-fade-in">
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-xs text-gray-500 italic">{label}…</span>
    </div>
  );
};

/* ─── Delete confirm button ───────────────────────────────────────────────── */
/**
 * Two-step delete: first click arms it (turns red + asks "Sure?"),
 * second click within 3 s confirms. Auto-resets if not confirmed.
 */
const DeleteButton = ({ onConfirm, deleting }) => {
  const [armed, setArmed] = useState(false);
  const armTimer = useRef(null);

  function handleClick(e) {
    e.stopPropagation();
    if (deleting) return;
    if (!armed) {
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 3000);
    } else {
      clearTimeout(armTimer.current);
      setArmed(false);
      onConfirm();
    }
  }

  // clean up timer on unmount
  useEffect(() => () => clearTimeout(armTimer.current), []);

  return (
    <button
      onClick={handleClick}
      title={armed ? "Click again to confirm delete" : "Delete message"}
      className="delete-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200"
      style={
        armed
          ? {
              background: "rgba(239,68,68,0.18)",
              border: "1px solid rgba(239,68,68,0.45)",
              color: "#f87171",
            }
          : {
              background: "var(--surface-4)",
              border: "1px solid var(--border-muted)",
              color: "rgba(180,185,220,0.6)",
            }
      }
      disabled={deleting}
    >
      {deleting ? (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <MdDeleteOutline size={13} />
      )}
      {armed && !deleting && <span>Sure?</span>}
    </button>
  );
};

/* ─── Message bubble ──────────────────────────────────────────────────────── */
const MessageBubble = ({ message, isSelf, onReact, onDelete }) => {
  const [showEmoji, setShowEmoji]   = useState(false);
  const [deleting,  setDeleting]    = useState(false);
  const color  = userColor(message.sender);
  const avatar = avatarUrl(message.sender);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`message-row group/row flex items-end gap-2 mb-3 animate-message-pop ${
        isSelf ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* avatar */}
      <div className="flex-shrink-0 status-online">
        <div
          className="w-8 h-8 rounded-full overflow-hidden ring-2"
          style={{ ringColor: color + "66" }}
        >
          <img src={avatar} alt={message.sender} className="w-full h-full" />
        </div>
      </div>

      {/* bubble + meta */}
      <div className={`flex flex-col max-w-[70%] ${isSelf ? "items-end" : "items-start"}`}>
        {/* sender name + delete button row */}
        <div className={`flex items-center gap-2 mb-1 px-1 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] font-semibold" style={{ color }}>
            {message.sender}
          </span>

          {/* delete button — only for own messages, visible on row hover */}
          {isSelf && (
            <div className="opacity-0 group-hover/row:opacity-100 transition-opacity duration-150">
              <DeleteButton onConfirm={handleDelete} deleting={deleting} />
            </div>
          )}
        </div>

        {/* bubble */}
        <div className="relative group/bubble">
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed transition-opacity duration-300 ${
              isSelf ? "bubble-self" : "bubble-other"
            } ${deleting ? "opacity-40" : "opacity-100"}`}
            style={
              isSelf
                ? {
                    background:
                      "linear-gradient(135deg, rgba(79,110,247,0.30), rgba(139,92,246,0.22))",
                    border: "1px solid rgba(107,142,255,0.25)",
                    color: "#e8eaf6",
                  }
                : {
                    background: "var(--surface-3)",
                    border: "1px solid var(--border-muted)",
                    color: "#d4d8f0",
                  }
            }
          >
            {message.content}
          </div>

          {/* emoji react trigger */}
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className={`emoji-trigger absolute ${
              isSelf ? "left-[-34px]" : "right-[-34px]"
            } bottom-1 w-7 h-7 rounded-full flex items-center justify-center text-sm`}
            style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
            title="React"
          >
            😊
          </button>

          {/* emoji picker popover */}
          {showEmoji && (
            <div
              className={`absolute bottom-8 ${
                isSelf ? "right-0" : "left-0"
              } z-30 flex gap-1 p-2 rounded-2xl shadow-xl animate-fade-in`}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-normal)",
              }}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onReact(message, emoji); setShowEmoji(false); }}
                  className="w-8 h-8 text-lg rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 px-1">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(message, emoji)}
                className={`reaction-pill ${users.includes("__self") ? "active" : ""}`}
              >
                {emoji}
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* timestamp */}
        <span
          className="text-[10px] text-gray-600 mt-1 px-1"
          title={formatTimestamp(message.timeStamp)}
        >
          {timeAgo(message.timeStamp)}
        </span>
      </div>
    </div>
  );
};

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
const Sidebar = ({ roomId, roomPassword, currentUser, onlineUsers, onLeave, onCopyId }) => {
  const [copiedId,  setCopiedId]  = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [showPwd,   setShowPwd]   = useState(false);

  function handleCopyId() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedId(true);
      onCopyId();
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  function handleCopyPwd() {
    navigator.clipboard.writeText(roomPassword).then(() => {
      setCopiedPwd(true);
      toast.success("Password copied!", { icon: "🔑", duration: 2000 });
      setTimeout(() => setCopiedPwd(false), 2000);
    });
  }

  return (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0"
      style={{ background: "var(--surface-1)", borderRight: "1px solid var(--border-subtle)" }}
    >
      {/* logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-500))",
            boxShadow: "0 4px 16px rgba(79,110,247,0.3)",
          }}
        >
          💬
        </div>
        <span className="text-lg font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>
          HangX
        </span>
      </div>

      {/* room info */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Current Room</p>

        {/* Room ID row */}
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-2 mb-2"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}
        >
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Room ID</p>
            <p className="font-bold text-sm truncate" style={{ fontFamily: "var(--font-display)", color: "var(--color-brand-400)" }}>
              #{roomId}
            </p>
          </div>
          <button
            onClick={handleCopyId}
            className="btn-icon w-8 h-8 flex-shrink-0"
            style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
            title={copiedId ? "Copied!" : "Copy Room ID"}
          >
            {copiedId ? <MdCheck size={15} className="text-green-400" /> : <MdContentCopy size={15} className="text-gray-400" />}
          </button>
        </div>

        {/* Password row */}
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-2"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Password</p>
            <p
              className="font-mono font-bold text-sm truncate transition-all duration-300 select-none cursor-pointer"
              style={{
                color: "#a78bfa",
                letterSpacing: showPwd ? "0.04em" : "0.15em",
                filter: showPwd ? "none" : "blur(5px)",
                userSelect: showPwd ? "text" : "none",
              }}
              onClick={() => setShowPwd((v) => !v)}
              title={showPwd ? "Click to hide" : "Click to reveal"}
            >
              {roomPassword || "••••••••••••"}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* reveal toggle */}
            <button
              onClick={() => setShowPwd((v) => !v)}
              className="btn-icon w-7 h-7"
              style={{ background: "transparent" }}
              title={showPwd ? "Hide password" : "Reveal password"}
            >
              {showPwd
                ? <MdVisibilityOff size={14} className="text-gray-500" />
                : <MdVisibility size={14} className="text-gray-500" />}
            </button>
            {/* copy */}
            <button
              onClick={handleCopyPwd}
              className="btn-icon w-8 h-8"
              style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}
              title={copiedPwd ? "Copied!" : "Copy password"}
            >
              {copiedPwd ? <MdCheck size={15} className="text-green-400" /> : <MdContentCopy size={15} className="text-gray-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* online users */}
      <div className="px-5 py-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <MdPeople size={14} className="text-gray-600" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
            Online — {onlineUsers.length}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {onlineUsers.map((user) => (
            <div key={user} className="user-chip">
              <div className="status-online flex-shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={avatarUrl(user)} alt={user} className="w-full h-full" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate"
                  style={{ color: user === currentUser ? "var(--color-brand-400)" : userColor(user) }}>
                  {user}
                </p>
                {user === currentUser && <p className="text-[10px] text-gray-600">You</p>}
              </div>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p className="text-xs text-gray-600 italic px-1">No users yet…</p>
          )}
        </div>
      </div>

      {/* profile + leave */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            <img src={avatarUrl(currentUser)} alt={currentUser} className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-brand-400)" }}>
              {currentUser}
            </p>
            <p className="text-[10px] text-gray-600">Online</p>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="btn-danger w-full rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <MdLogout size={16} />
          Leave Room
        </button>
      </div>
    </aside>
  );
};

/* ─── Main ChatPage ───────────────────────────────────────────────────────── */
const ChatPage = () => {
  const {
    roomId, currentUser, connected,
    roomToken, roomPassword,
    typingUsers, addTypingUser, removeTypingUser,
    onlineUsers, addOnlineUser, removeOnlineUser,
    resetChat,
  } = useChatContext();

  const navigate = useNavigate();

  useEffect(() => { if (!connected) navigate("/"); }, [connected]);

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  const chatBoxRef    = useRef(null);
  const inputRef      = useRef(null);
  const typingTimeout = useRef(null);
  const isTypingSent  = useRef(false);

  /* ── Load message history ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!connected) return;
    (async () => {
      try {
        const msgs = await getMessagess(roomId);
        setMessages(msgs);
      } catch {
        toast.error("Could not load message history");
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, []);

  /* ── Auto-scroll ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  /* ── WebSocket connect + subscribe ───────────────────────────────────── */
  useEffect(() => {
    if (!connected) return;

    const sock   = new SockJS(`${baseURL}/chat`);
    const client = Stomp.over(sock);
    client.debug = () => {};

    client.connect({ Authorization: `Bearer ${roomToken}` }, () => {
      setStompClient(client);

      /* new messages */
      client.subscribe(`/topic/room/${roomId}`, (frame) => {
        const msg = JSON.parse(frame.body);
        setMessages((prev) => [...prev, msg]);
      });

      /* delete events — remove the message from local state on all clients */
      client.subscribe(`/topic/room/${roomId}/delete`, (frame) => {
        const { messageId } = JSON.parse(frame.body);
        setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
      });

      /* typing events */
      client.subscribe(`/topic/room/${roomId}/typing`, (frame) => {
        const { sender, typing } = JSON.parse(frame.body);
        if (sender === currentUser) return;
        typing ? addTypingUser(sender) : removeTypingUser(sender);
      });

      /* presence events */
      client.subscribe(`/topic/room/${roomId}/presence`, (frame) => {
        const { sender, online } = JSON.parse(frame.body);
        online ? addOnlineUser(sender) : removeOnlineUser(sender);
      });

      /* announce own presence */
      client.send(`/app/presence/${roomId}`, {}, JSON.stringify({ sender: currentUser, online: true, roomId }));
      addOnlineUser(currentUser);

      toast.success("Connected to room", { icon: "🟢", duration: 2000 });
    });

    return () => {
      if (client.connected) {
        client.send(`/app/presence/${roomId}`, {}, JSON.stringify({ sender: currentUser, online: false, roomId }));
        client.disconnect();
      }
      removeOnlineUser(currentUser);
    };
  }, [roomId]);

  /* ── Typing ──────────────────────────────────────────────────────────── */
  const sendTyping = useCallback(
    (isTyping) => {
      if (!stompClient?.connected) return;
      stompClient.send(`/app/typing/${roomId}`, {}, JSON.stringify({ sender: currentUser, typing: isTyping, roomId }));
    },
    [stompClient, roomId, currentUser]
  );

  function handleInputChange(e) {
    setInput(e.target.value);
    if (!isTypingSent.current) { sendTyping(true); isTypingSent.current = true; }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { sendTyping(false); isTypingSent.current = false; }, 1800);
  }

  /* ── Send message ────────────────────────────────────────────────────── */
  function sendMessage() {
    if (!stompClient?.connected || !input.trim()) return;
    stompClient.send(`/app/sendMessage/${roomId}`, {}, JSON.stringify({ sender: currentUser, content: input.trim(), roomId }));
    clearTimeout(typingTimeout.current);
    sendTyping(false);
    isTypingSent.current = false;
    setInput("");
    inputRef.current?.focus();
  }

  /* ── Delete message ──────────────────────────────────────────────────── */
  async function handleDeleteMessage(message) {
    if (!message.messageId) {
      // Legacy message without an ID — remove client-side only
      setMessages((prev) =>
        prev.filter((m) => !(m.sender === message.sender && m.timeStamp === message.timeStamp && m.content === message.content))
      );
      return;
    }

    // Optimistic removal
    setMessages((prev) => prev.filter((m) => m.messageId !== message.messageId));

    try {
      await deleteMessageApi(roomId, message.messageId, currentUser);
      // The WS broadcast from the server will confirm removal on other clients.
      // Our own client already removed it optimistically, so nothing else to do.
    } catch (err) {
      // Roll back on failure
      setMessages((prev) => {
        const alreadyPresent = prev.some((m) => m.messageId === message.messageId);
        return alreadyPresent ? prev : [...prev, message].sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp));
      });
      if (err.response?.status === 403) {
        toast.error("You can only delete your own messages");
      } else {
        toast.error("Could not delete message");
      }
    }
  }

  /* ── Reactions (client-side) ─────────────────────────────────────────── */
  function handleReact(targetMessage, emoji) {
    setMessages((prev) =>
      prev.map((msg) => {
        const isTarget =
          msg.sender === targetMessage.sender &&
          msg.timeStamp === targetMessage.timeStamp &&
          msg.content === targetMessage.content;
        if (!isTarget) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] ? [...reactions[emoji]] : [];
        const selfIdx = users.indexOf("__self");
        if (selfIdx === -1) {
          reactions[emoji] = [...users, "__self"];
        } else {
          users.splice(selfIdx, 1);
          if (users.length === 0) delete reactions[emoji];
          else reactions[emoji] = users;
        }
        return { ...msg, reactions };
      })
    );
  }

  /* ── Leave ───────────────────────────────────────────────────────────── */
  function handleLeave() {
    if (stompClient?.connected) {
      stompClient.send(`/app/presence/${roomId}`, {}, JSON.stringify({ sender: currentUser, online: false, roomId }));
      stompClient.disconnect();
    }
    resetChat();
    navigate("/");
  }

  function handleCopyId() {
    toast.success("Room ID copied to clipboard!", { icon: "📋", duration: 2000 });
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-0)" }}>

      {/* sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed lg:relative lg:translate-x-0 z-40 h-full transition-transform duration-300 ease-in-out`}>
        <Sidebar roomId={roomId} roomPassword={roomPassword} currentUser={currentUser} onlineUsers={onlineUsers} onLeave={handleLeave} onCopyId={handleCopyId} />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* main area */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* header */}
        <header
          className="flex items-center gap-4 px-5 py-3.5 flex-shrink-0"
          style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="lg:hidden btn-icon w-9 h-9"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}
          >
            {sidebarOpen ? <HiX size={18} /> : <HiMenuAlt2 size={18} />}
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}>
              #
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base truncate" style={{ fontFamily: "var(--font-display)", color: "var(--color-brand-400)" }}>
                {roomId}
              </h1>
              <p className="text-[11px] text-gray-600">{onlineUsers.length} online</p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-gray-400">{onlineUsers.length} online</span>
          </div>

          <button onClick={handleLeave} className="btn-danger rounded-xl px-3 py-2 text-xs font-semibold hidden sm:flex items-center gap-1.5">
            <MdLogout size={14} />
            Leave
          </button>
        </header>

        {/* messages */}
        <main ref={chatBoxRef} className="flex-1 overflow-y-auto px-4 py-6" style={{ background: "var(--surface-0)" }}>
          {loadingMsgs ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-pulse-glow" style={{ background: "var(--surface-3)" }}>
                💬
              </div>
              <p className="text-sm text-gray-600">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}>
                👋
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-300 mb-1">No messages yet</p>
                <p className="text-sm text-gray-600">
                  Be the first to say hello in <span style={{ color: "var(--color-brand-400)" }}>#{roomId}</span>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="divider-label mb-6">
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </div>
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.messageId || `${message.sender}-${message.timeStamp}-${index}`}
                  message={message}
                  isSelf={message.sender === currentUser}
                  onReact={handleReact}
                  onDelete={handleDeleteMessage}
                />
              ))}
            </>
          )}
          <TypingIndicator users={typingUsers} />
        </main>

        {/* input bar */}
        <div className="flex-shrink-0 px-4 py-3" style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2"
            style={{ background: "var(--surface-3)", border: "1px solid var(--border-muted)" }}>
            <button
              className="btn-icon w-8 h-8 flex-shrink-0"
              style={{ background: "transparent" }}
              title="Emoji (coming soon)"
              onClick={() => toast("Emoji picker coming soon! 😄", { icon: "✨" })}
            >
              <MdEmojiEmotions size={20} className="text-gray-500 hover:text-yellow-400 transition-colors" />
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              type="text"
              placeholder={`Message #${roomId}…`}
              className="flex-1 bg-transparent outline-none text-sm py-1"
              style={{ color: "#e8eaf6", caretColor: "var(--color-brand-400)" }}
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="btn-icon w-9 h-9 flex-shrink-0 transition-all"
              style={
                input.trim()
                  ? { background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))", boxShadow: "0 2px 12px rgba(79,110,247,0.4)" }
                  : { background: "var(--surface-4)", opacity: 0.5 }
              }
              title="Send (Enter)"
            >
              <MdSend size={17} className="text-white" />
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-700 mt-2">
            Press{" "}
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: "var(--surface-4)", border: "1px solid var(--border-muted)" }}>
              Enter
            </kbd>{" "}
            to send · Hover your message to delete it
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
