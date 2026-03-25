import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { useAuth } from "./contexts/AuthContext";
import CasesPage from "./pages/CasesPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import LoginPage from "./pages/LoginPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import TemplatesPage from "./pages/TemplatesPage";
import UsersPage from "./pages/UsersPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isOwner } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        {isOwner ? <Route path="/users" element={<UsersPage />} /> : null}
        <Route
          path="/activity"
          element={<PlaceholderPage title="Activity" subtitle="Case activity and audit log will appear here in a later phase." />}
        />
        <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Office and user preferences." />} />
        <Route path="/support" element={<PlaceholderPage title="Support" subtitle="Help and contact options." />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
