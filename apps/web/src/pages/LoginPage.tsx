import { Button, Card, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";

type LoginValues = { email: string; password: string };

export default function LoginPage() {
  const [form] = Form.useForm<LoginValues>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      await login(values.email, values.password);
      message.success(t("welcome"));
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        padding: 16,
      }}
    >
      <Card style={{ width: 420, borderRadius: 14 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          {t("loginTitle")}
        </Typography.Title>
        <Typography.Paragraph type="secondary">{t("loginSubtitle")}</Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="email" label={t("email")} rules={[{ required: true }, { type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={t("password")} rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            {t("login")}
          </Button>
        </Form>
      </Card>
    </div>
  );
}

