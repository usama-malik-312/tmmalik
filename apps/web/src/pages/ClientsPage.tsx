import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tooltip, Typography } from "antd";
import { useState } from "react";
import { api, unwrap } from "../api";
import { useI18n } from "../contexts/I18nContext";
import CnicInput from "../components/CnicInput";
import type { Client } from "../types";

export default function ClientsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form] = Form.useForm();
  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: () => unwrap<Client[]>(api.get("/clients")) });

  const createMutation = useMutation({ mutationFn: (payload: Partial<Client>) => api.post("/clients", payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<Client> }) => api.put(`/clients/${id}`, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }) });
  const deleteMutation = useMutation({ mutationFn: (id: number) => api.delete(`/clients/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }) });

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (editing) await updateMutation.mutateAsync({ id: editing.id, payload: values });
    else await createMutation.mutateAsync(values);
    setOpen(false); setEditing(null); form.resetFields();
  };

  return (
    <>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t("clients")}</Typography.Title>
        <Button type="primary" onClick={() => setOpen(true)}>{t("clients")}</Button>
      </Space>
      <Table rowKey="id" dataSource={clientsQuery.data ?? []} columns={[
        { title: t("fullName"), dataIndex: "name" },
        { title: t("cnicNumber"), dataIndex: "cnic" },
        { title: "Phone", dataIndex: "phone" },
        { title: "Actions", render: (_, record: Client) => (
          <Space>
            <Tooltip title="Edit">
              <EditOutlined
                style={{ fontSize: 16, color: "#6366f1", cursor: "pointer" }}
                onClick={() => {
                  setEditing(record);
                  form.setFieldsValue(record);
                  setOpen(true);
                }}
              />
            </Tooltip>
            <Popconfirm title="Delete client?" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Tooltip title="Delete">
                <DeleteOutlined style={{ fontSize: 16, color: "#ef4444", cursor: "pointer" }} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ) }
      ]} />
      <Modal title={editing ? "Edit Client" : "Add Client"} open={open} onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }} onOk={onSubmit}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t("fullName")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item
            name="cnic"
            label={t("cnicNumber")}
            rules={[
              { required: true, message: "CNIC is required" },
              {
                pattern: /^\d{5}-\d{7}-\d$/,
                message: "CNIC must be in format 11111-1111111-1",
              },
            ]}
          >
            <CnicInput placeholder="11111-1111111-1" />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label={t("address")} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
