import {
  CustomerServiceOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FormOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Input, Layout, Menu, Select, Space, Typography } from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";

const { Header, Sider, Content } = Layout;

const PRIMARY = "#6366f1";
const SIDER_BG = "#0f172a";
const SIDER_WIDTH = 268;
const SIDER_COLLAPSED = 88;

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isOwner, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const path = location.pathname;

  const mainItems = [
    { key: "/", icon: <DashboardOutlined />, label: t("dashboard"), title: t("dashboard") },
    { key: "/clients", icon: <TeamOutlined />, label: t("clients"), title: t("clients") },
    { key: "/cases", icon: <FolderOpenOutlined />, label: t("cases"), title: t("cases") },
    { key: "/documents", icon: <FileTextOutlined />, label: t("documentGenerator"), title: t("documentGenerator") },
    { key: "/templates", icon: <FormOutlined />, label: t("templates"), title: t("templates") },
    ...(isOwner ? [{ key: "/users", icon: <UserOutlined />, label: t("users"), title: t("users") }] : []),
    { key: "/activity", icon: <HistoryOutlined />, label: t("activity"), title: t("activity") },
  ];

  const bottomItems = [
    { key: "/settings", icon: <SettingOutlined />, label: t("settings"), title: t("settings") },
    { key: "/support", icon: <CustomerServiceOutlined />, label: t("support"), title: t("support") },
  ];

  const onMenuClick = ({ key }: { key: string }) => navigate(key);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED}
        style={{
          background: SIDER_BG,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            padding: collapsed ? "20px 12px" : "20px 20px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${PRIMARY}, #8b5cf6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileTextOutlined style={{ color: "#fff", fontSize: 20 }} />
          </div>
          {!collapsed && (
            <div>
              <Typography.Text strong style={{ color: "#fff", fontSize: 15, display: "block" }}>
                {t("appTitle")}
              </Typography.Text>
              <Typography.Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("appSubtitle")}
              </Typography.Text>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
          <Menu
            theme="dark"
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[path]}
            items={mainItems}
            onClick={onMenuClick}
            style={{ background: "transparent", border: "none" }}
            className="app-sidebar-menu"
          />
        </div>

        <div style={{ padding: "8px 0 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Menu
            theme="dark"
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[path]}
            items={bottomItems}
            onClick={onMenuClick}
            style={{ background: "transparent", border: "none" }}
            className="app-sidebar-menu"
          />
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: 64,
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
            style={{ fontSize: 18, width: 40, height: 40 }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
          <Input.Search
            placeholder={t("searchPlaceholder")}
            allowClear
            style={{ maxWidth: 420, flex: 1 }}
            onSearch={() => {}}
          />
          <Space size="middle" style={{ marginLeft: "auto" }}>
            <Select
              size="small"
              value={language}
              onChange={(value) => setLanguage(value as "en" | "ur")}
              options={[
                { value: "en", label: t("english") },
                { value: "ur", label: t("urdu") },
              ]}
              style={{ width: 100 }}
            />
            <Badge count={0} size="small">
              <Button type="text" icon={<NotificationOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Button type="text" icon={<SettingOutlined style={{ fontSize: 18 }} />} onClick={() => navigate("/settings")} />
            <Space size={12} style={{ cursor: "pointer" }} onClick={() => navigate("/settings")}>
              <div style={{ textAlign: "right", lineHeight: 1.3 }}>
                <Typography.Text strong style={{ display: "block", fontSize: 14 }}>
                  {`${user?.fname ?? ""} ${user?.lname ?? ""}`.trim() || "User"}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.userType === -1 ? "Owner" : user?.userType === 1 ? "Manager" : "Staff"}
                </Typography.Text>
              </div>
              <Avatar style={{ background: PRIMARY }} size={40}>
                {`${user?.fname?.[0] ?? "U"}${user?.lname?.[0] ?? ""}`.toUpperCase()}
              </Avatar>
            </Space>
            <Button
              type="default"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              {t("logout")}
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: 0, minHeight: 280, background: "#f8fafc", padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
