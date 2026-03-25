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
} from "@ant-design/icons";
import { Avatar, Badge, Button, Input, Layout, Menu, Space, Typography } from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const PRIMARY = "#6366f1";
const SIDER_BG = "#0f172a";
const SIDER_WIDTH = 268;
const SIDER_COLLAPSED = 88;

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const mainItems = [
    { key: "/", icon: <DashboardOutlined />, label: "Dashboard", title: "Dashboard" },
    { key: "/clients", icon: <TeamOutlined />, label: "Clients", title: "Clients" },
    { key: "/cases", icon: <FolderOpenOutlined />, label: "Cases", title: "Cases" },
    { key: "/documents", icon: <FileTextOutlined />, label: "Document Generator", title: "Document Generator" },
    { key: "/templates", icon: <FormOutlined />, label: "Templates", title: "Templates" },
    { key: "/activity", icon: <HistoryOutlined />, label: "Activity", title: "Activity" },
  ];

  const bottomItems = [
    { key: "/settings", icon: <SettingOutlined />, label: "Settings", title: "Settings" },
    { key: "/support", icon: <CustomerServiceOutlined />, label: "Support", title: "Support" },
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
                The Sanctum
              </Typography.Text>
              <Typography.Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Legal &amp; Property
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
            placeholder="Search templates or clients..."
            allowClear
            style={{ maxWidth: 420, flex: 1 }}
            onSearch={() => {}}
          />
          <Space size="middle" style={{ marginLeft: "auto" }}>
            <Badge count={0} size="small">
              <Button type="text" icon={<NotificationOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Button type="text" icon={<SettingOutlined style={{ fontSize: 18 }} />} onClick={() => navigate("/settings")} />
            <Space size={12} style={{ cursor: "pointer" }} onClick={() => navigate("/settings")}>
              <div style={{ textAlign: "right", lineHeight: 1.3 }}>
                <Typography.Text strong style={{ display: "block", fontSize: 14 }}>
                  Barrister Ahmed
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Senior Associate
                </Typography.Text>
              </div>
              <Avatar style={{ background: PRIMARY }} size={40}>
                BA
              </Avatar>
            </Space>
          </Space>
        </Header>

        <Content style={{ margin: 0, minHeight: 280, background: "#f8fafc", padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
