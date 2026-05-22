import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./styles.css";

import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/"
                        element={
                            <RequireAuth>
                                <Dashboard />
                            </RequireAuth>
                        }
                    />

                    {/* Catch-all: send any unknown route back home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
);
