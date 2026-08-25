import { createContext, useContext, useState, useCallback } from "react";

const ChatContext = createContext();

const TOKEN_KEY    = "hangx_room_token";
const PASSWORD_KEY = "hangx_room_password";

export const ChatProvider = ({ children }) => {
  const [roomId,      setRoomId]      = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [connected,   setConnected]   = useState(false);

  // JWT scoped to the current room — persisted in sessionStorage so a
  // page refresh doesn't log the user out mid-session.
  const [roomToken, setRoomTokenState] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );

  const setRoomToken = useCallback((token) => {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
    setRoomTokenState(token || "");
  }, []);

  // Plaintext room password — kept in sessionStorage so the sidebar can
  // display it for the session lifetime. Cleared on logout.
  const [roomPassword, setRoomPasswordState] = useState(
    () => sessionStorage.getItem(PASSWORD_KEY) || ""
  );

  const setRoomPassword = useCallback((pw) => {
    if (pw) {
      sessionStorage.setItem(PASSWORD_KEY, pw);
    } else {
      sessionStorage.removeItem(PASSWORD_KEY);
    }
    setRoomPasswordState(pw || "");
  }, []);

  // Typing users (array of usernames, excluding self)
  const [typingUsers, setTypingUsers] = useState([]);

  // Online users in the current room
  const [onlineUsers, setOnlineUsers] = useState([]);

  const addTypingUser = useCallback((username) => {
    setTypingUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
  }, []);

  const removeTypingUser = useCallback((username) => {
    setTypingUsers((prev) => prev.filter((u) => u !== username));
  }, []);

  const addOnlineUser = useCallback((username) => {
    setOnlineUsers((prev) => prev.includes(username) ? prev : [...prev, username]);
  }, []);

  const removeOnlineUser = useCallback((username) => {
    setOnlineUsers((prev) => prev.filter((u) => u !== username));
  }, []);

  /** Full reset on logout — clears token and password from storage too. */
  const resetChat = useCallback(() => {
    setRoomId("");
    setCurrentUser("");
    setConnected(false);
    setTypingUsers([]);
    setOnlineUsers([]);
    setRoomToken("");
    setRoomPassword("");
  }, [setRoomToken, setRoomPassword]);

  return (
    <ChatContext.Provider
      value={{
        roomId,       setRoomId,
        currentUser,  setCurrentUser,
        connected,    setConnected,
        roomToken,    setRoomToken,
        roomPassword, setRoomPassword,
        typingUsers,  addTypingUser,  removeTypingUser,
        onlineUsers,  addOnlineUser,  removeOnlineUser,
        resetChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

const useChatContext = () => useContext(ChatContext);
export default useChatContext;
