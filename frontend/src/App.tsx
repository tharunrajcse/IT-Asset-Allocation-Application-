import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { ProcurementDashboard } from "./pages/ProcurementDashboard";
import { FinanceDashboard } from "./pages/FinanceDashboard";
import { useAuth } from "./lib/auth";
import { TopBar } from "./components/TopBar";

export function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      <TopBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            user ? (
              user.role === "EMPLOYEE" ? (
                <Navigate to="/employee" replace />
              ) : user.role === "MANAGER" ? (
                <Navigate to="/manager" replace />
              ) : user.role === "PROCUREMENT" ? (
                <Navigate to="/procurement" replace />
              ) : (
                <Navigate to="/finance" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/employee" element={<Guard role="EMPLOYEE"><EmployeeDashboard /></Guard>} />
        <Route path="/manager" element={<Guard role="MANAGER"><ManagerDashboard /></Guard>} />
        <Route path="/procurement" element={<Guard role="PROCUREMENT"><ProcurementDashboard /></Guard>} />
        <Route path="/finance" element={<Guard role="FINANCE"><FinanceDashboard /></Guard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function Guard(props: { role: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== props.role) return <Navigate to="/" replace />;
  return <>{props.children}</>;
}

