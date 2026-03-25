import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { api, unwrap } from "../api";
import { useI18n } from "../contexts/I18nContext";
import type { CaseItem, CaseStatus, Client } from "../types";

export default function CasesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: () => unwrap<Client[]>(api.get("/clients")) });
  const casesQuery = useQuery({ queryKey: ["cases"], queryFn: () => unwrap<CaseItem[]>(api.get("/cases")) });
  const createMutation = useMutation({ mutationFn: (payload: Partial<CaseItem>) => api.post("/cases", payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }) });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: number; status: CaseStatus }) => api.put(`/cases/${id}`, { status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }) });

  const onCreate = async () => { const values = await form.validateFields(); await createMutation.mutateAsync(values); form.resetFields(); setOpen(false); };

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
          <Select value={record.status} style={{ width: 160 }} onChange={(status: CaseStatus) => statusMutation.mutate({ id: record.id, status })} options={[{ value: "draft", label: <Tag>draft</Tag> }, { value: "in_progress", label: <Tag color="blue">in_progress</Tag> }, { value: "completed", label: <Tag color="green">completed</Tag> }]} />
        ) }
      ]} />
      <Modal title="Create Case" open={open} onCancel={() => setOpen(false)} onOk={onCreate}>
        <Form form={form} layout="vertical" initialValues={{ status: "draft" }}>
          <Form.Item name="clientId" label={t("clients")} rules={[{ required: true }]}><Select options={(clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="caseType" label="Case Type" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={[{ value: "draft" }, { value: "in_progress" }, { value: "completed" }]} /></Form.Item>
          <Form.Item name="propertyDetails" label="Property Details" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="notes" label="Notes" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
