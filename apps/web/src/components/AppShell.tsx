import {
  CustomerServiceOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FormOutlined,
  HistoryOutlined,
  InboxOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Dropdown,
  Layout,
  Menu,
  Select,
  Space,
  Typography,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";

const { Header, Sider, Content } = Layout;

const PRIMARY = "#6366f1";
const SIDER_BG = "#0f172a";
const SIDER_WIDTH = 100;

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { t, language, setLanguage, dir } = useI18n();
  const path = location.pathname;

  const formatItem = (key: string, icon: React.ReactNode, labelStr: string) => ({
    key,
    label: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, height: '100%', width: '100%' }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <span style={{ fontSize: 13, lineHeight: 1, whiteSpace: 'normal', textAlign: 'center' }}>{labelStr}</span>
      </div>
    ),
    title: labelStr,
  });

  const mainItems = [
    formatItem("/", <DashboardOutlined />, t("dashboard")),
    formatItem("/clients", <TeamOutlined />, t("clients")),
    formatItem("/cases", <FolderOpenOutlined />, t("cases")),
    formatItem("/documents", <FileTextOutlined />, t("documentGenerator")),
    formatItem("/templates", <FormOutlined />, t("templates")),
    formatItem("/archives", <InboxOutlined />, t("vault")),
    ...(isAdmin ? [formatItem("/users", <UserOutlined />, t("users"))] : []),
    formatItem("/activity", <HistoryOutlined />, t("activity")),
  ];

  const bottomItems = [
    formatItem("/support", <CustomerServiceOutlined />, t("support")),
  ];

  const onMenuClick = ({ key }: { key: string }) => navigate(key);

  const avatarMenu = {
    items: [
      {
        key: "profile",
        label: t("settings"),
        onClick: () => navigate("/profile"),
      },
      {
        key: "logout",
        label: t("logout"),
        danger: true,
        onClick: async () => {
          await logout();
          navigate("/login");
        },
      },
    ],
  };

  const dropdownPlacement = dir === "rtl" ? "bottomLeft" : "bottomRight";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={SIDER_WIDTH}
        style={{
          background: SIDER_BG,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            padding: "20px 0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography.Text strong style={{ fontSize: 16, color: "#fff" }}>Menu</Typography.Text>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "12px 8px" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[path]}
            items={mainItems}
            onClick={onMenuClick}
            style={{ background: "transparent", border: "none" }}
            className="app-sidebar-menu"
          />
        </div>

        <div
          style={{
            padding: "8px 8px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Menu
            theme="dark"
            mode="inline"
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
            justifyContent: "space-between",
            gap: 16,
            height: 64,
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            <div>
              <Typography.Text
                strong
                style={{ color: "#000", fontSize: 15, display: "block", lineHeight: 1.2 }}
              >
                {t("appTitle")}
              </Typography.Text>
              {/* <Typography.Text
                style={{
                  color: "#666",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t("appSubtitle")}
              </Typography.Text> */}
            </div>
          </div>

          <Space
            size="middle"
            style={{
              justifyContent: "flex-end",
            }}
          >
            <Space size="middle" style={{ flexShrink: 0 }}>
              {/* <Badge count={0} size="small">
                <Button type="text" icon={<NotificationOutlined style={{ fontSize: 18 }} />} />
              </Badge> */}
              <Select
                size="small"
                value={language}
                onChange={(value) => setLanguage(value as "en" | "ur")}
                options={[
                  { value: "en", label: t("english") },
                  { value: "ur", label: t("urdu") },
                ]}
                style={{ width: 110, margin: "0px 10px" }}
                className="mx-2"
              />
              <Dropdown
                menu={avatarMenu}
                trigger={["hover"]}
                placement={dropdownPlacement}
              >
                <Space size={12} style={{ cursor: "pointer" }}>
                  <div
                    style={{
                      textAlign: dir === "rtl" ? "left" : "right",
                      lineHeight: 1.3,
                    }}
                  >
                    <Typography.Text
                      strong
                      style={{ display: "block", fontSize: 14 }}
                    >
                      {`${user?.fname ?? ""} ${user?.lname ?? ""}`.trim() ||
                        "User"}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {user?.userType === -1
                        ? "Owner"
                        : user?.userType === 1
                          ? "Manager"
                          : "Staff"}
                    </Typography.Text>
                  </div>
                  <Avatar style={{ background: PRIMARY }} size={40}>
                    {`${user?.fname?.[0] ?? "U"}${user?.lname?.[0] ?? ""}`.toUpperCase()}
                  </Avatar>
                </Space>
              </Dropdown>
            </Space>
          </Space>
        </Header>

        <Content
          style={{
            margin: 0,
            minHeight: 280,
            background: "#f8fafc",
            padding: 24,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
