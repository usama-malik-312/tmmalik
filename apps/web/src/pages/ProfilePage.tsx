import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Col, Form, Input, Row, Typography, message } from "antd";
import { useEffect } from "react";
import { api, unwrap } from "../api";
import type { User } from "../types";
import { useI18n } from "../contexts/I18nContext";

type Me = Omit<User, "password">;

export default function ProfilePage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => unwrap<Me>(api.get("/auth/me")),
  });

  const [form] = Form.useForm<Partial<Me>>();

  useEffect(() => {
    if (!meQuery.data) return;
    form.setFieldsValue(meQuery.data);
  }, [meQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: (
      payload: Partial<{
        fname: string;
        lname: string;
        address: string;
        password: string;
      }>,
    ) => api.put("/auth/me", payload),
    onSuccess: () => {
      message.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => message.error("Failed to update profile."),
  });

  const onFinish = async () => {
    const values = await form.validateFields();
    await updateMutation.mutateAsync(values as any);
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {t("settings")}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {t("profileSubtitle")}
      </Typography.Paragraph>

      <Cardish>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="fname"
                label={t("firstName")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="lname"
                label={t("lastName")}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="address" label={t("address")}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="password" label={t("newPassword")}>
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            htmlType="submit"
            loading={updateMutation.isPending}
            style={{ marginTop: 8 }}
          >
            {t("save")}
          </Button>
        </Form>
      </Cardish>
    </div>
  );
}

function Cardish({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}
