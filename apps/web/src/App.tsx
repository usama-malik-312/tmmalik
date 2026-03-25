import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import CasesPage from "./pages/CasesPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import TemplatesPage from "./pages/TemplatesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route
          path="/activity"
          element={<PlaceholderPage title="Activity" subtitle="Case activity and audit log will appear here in a later phase." />}
        />
        <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Office and user preferences." />} />
        <Route path="/support" element={<PlaceholderPage title="Support" subtitle="Help and contact options." />} />
      </Route>
    </Routes>
  );
}
