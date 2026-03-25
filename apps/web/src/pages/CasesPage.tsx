import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import { api, unwrap } from "../api";
import { useI18n } from "../contexts/I18nContext";
import type { CaseItem, CaseStatus, Client } from "../types";
import CnicInput from "../components/CnicInput";

export default function CasesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [pendingStatus, setPendingStatus] = useState<CaseStatus | null>(null);
  const [pendingCaseId, setPendingCaseId] = useState<number | null>(null);
  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: () => unwrap<Client[]>(api.get("/clients")) });
  const casesQuery = useQuery({ queryKey: ["cases"], queryFn: () => unwrap<CaseItem[]>(api.get("/cases")) });
  const createMutation = useMutation({ mutationFn: (payload: Partial<CaseItem>) => api.post("/cases", payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: number; status: CaseStatus }) => api.put(`/cases/${id}`, { status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }) });

  const onCreate = async () => { const values = await form.validateFields(); await createMutation.mutateAsync(values); form.resetFields(); setOpen(false); };

  // Quick add client from within Create Case modal
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientForm] = Form.useForm();
  const createClientMutation = useMutation({
    mutationFn: (payload: Partial<Client>) => api.post("/clients", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setClientModalOpen(false);
      clientForm.resetFields();
    },
  });

  return (
    <>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{t("cases")}</Typography.Title>
        <Button type="primary" onClick={() => setOpen(true)}>Create Case</Button>
      </Space>
      <Table rowKey="id" dataSource={casesQuery.data ?? []} columns={[
        { title: t("clients"), render: (_, record: CaseItem) => record.client?.name ?? "-" },
        { title: "Case Type", dataIndex: "caseType" },
        { title: "Status", render: (_, record: CaseItem) => (
          <Popconfirm
            title={`Change status to ${pendingStatus ?? record.status}?`}
            open={pendingCaseId === record.id}
            onConfirm={() => {
              if (pendingStatus) statusMutation.mutate({ id: record.id, status: pendingStatus });
              setPendingStatus(null);
              setPendingCaseId(null);
            }}
            onCancel={() => {
              setPendingStatus(null);
              setPendingCaseId(null);
            }}
            okText="Confirm"
            cancelText="Cancel"
          >
            <Select
              value={record.status}
              style={{ width: 160 }}
              onChange={(status: CaseStatus) => {
                if (status === record.status) return;
                setPendingStatus(status);
                setPendingCaseId(record.id);
              }}
              options={[
                { value: "draft", label: <Tag>draft</Tag> },
                { value: "in_progress", label: <Tag color="blue">in_progress</Tag> },
                { value: "completed", label: <Tag color="green">completed</Tag> },
              ]}
            />
          </Popconfirm>
        ) }
      ]} />
      <Modal title="Create Case" open={open} onCancel={() => setOpen(false)} onOk={onCreate}>
        <Form form={form} layout="vertical" initialValues={{ status: "draft" }}>
          <Form.Item
            name="clientId"
            label={t("clients")}
            rules={[{ required: true, message: "Client is required" }]}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                style={{ flex: 1 }}
                showSearch
                optionFilterProp="label"
                value={form.getFieldValue("clientId")}
                options={(clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                onChange={(v) => {
                  form.setFieldValue("clientId", v);
                }}
              />
              <Tooltip title="Add client">
                <Button type="default" icon={<PlusOutlined />} onClick={() => setClientModalOpen(true)} />
              </Tooltip>
            </div>
          </Form.Item>
          <Form.Item name="caseType" label="Case Type" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ value: "draft" }, { value: "in_progress" }, { value: "completed" }]} /></Form.Item>
          <Form.Item name="propertyDetails" label="Property Details" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="notes" label="Notes" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Client"
        open={clientModalOpen}
        onCancel={() => setClientModalOpen(false)}
        confirmLoading={createClientMutation.isPending}
        onOk={async () => {
          const values = await clientForm.validateFields();
          await createClientMutation.mutateAsync(values as Partial<Client>);
        }}
      >
        <Form form={clientForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Full legal name" />
          </Form.Item>
          <Form.Item
            name="cnic"
            label="CNIC"
            rules={[
              { required: true, message: "CNIC is required" },
              { pattern: /^\d{5}-\d{7}-\d$/, message: "CNIC must be in format 11111-1111111-1" },
            ]}
          >
            <CnicInput placeholder="11111-1111111-1" />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input placeholder="0300-1234567" />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input placeholder="Residential address" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
