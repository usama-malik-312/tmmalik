import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { useAuth } from "./contexts/AuthContext";
import CaseDetailPage from "./pages/CaseDetailPage";
import CasesPage from "./pages/CasesPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import LoginPage from "./pages/LoginPage";
import ActivityPage from "./pages/ActivityPage";
import ArchivesPage from "./pages/ArchivesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import TemplatesPage from "./pages/TemplatesPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAdmin } = useAuth();

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
        <Route path="/cases/:id" element={<CaseDetailPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        {isAdmin ? <Route path="/users" element={<UsersPage />} /> : null}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Office and user preferences." />} />
        <Route path="/support" element={<PlaceholderPage title="Support" subtitle="Help and contact options." />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
