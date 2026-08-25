import React from "react";
import { Routes, Route } from "react-router";
import App from "../App";
import ChatPage from "../components/ChatPage";
import AdminDashboard from "../components/AdminDashboard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/"      element={<App />} />
      <Route path="/chat"  element={<ChatPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/about" element={<h1>This is about page</h1>} />
      <Route path="*"      element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;
