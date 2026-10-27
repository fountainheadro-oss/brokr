import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { SharedProperty } from "./pages/SharedProperty";
import { NotificationManager } from "./components/NotificationManager";
import { NotificationProvider } from "./components/NotificationProvider";

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<><NotificationManager /><Home /></>} />
          <Route path="/calendar" element={<><NotificationManager /><Calendar /></>} />
          <Route path="/share/:id" element={<SharedProperty />} />
          <Route path="/p/:id" element={<SharedProperty />} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

