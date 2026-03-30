import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, unwrapPaged } from "../api";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [draftCaseType, setDraftCaseType] = useState("");
  const [appliedCaseType, setAppliedCaseType] = useState("");

  const clientsQuery = useQuery({
    queryKey: ["clients", "picker"],
    queryFn: () => unwrapPaged<Client>(api.get("/clients", { params: { page: 1, pageSize: 500 } })),
  });

  const casesQuery = useQuery({
    queryKey: ["cases", "list", page, pageSize, search, statusFilter, appliedCaseType],
    queryFn: () =>
      unwrapPaged<CaseItem>(
        api.get("/cases", {
          params: {
            page,
            pageSize,
            search: search || undefined,
            status: statusFilter,
            caseType: appliedCaseType || undefined,
          },
        })
      ),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<CaseItem>) => api.post("/cases", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CaseStatus }) => api.put(`/cases/${id}`, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["cases", vars.id, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
    },
  });

  const onCreate = async () => {
    const values = await form.validateFields();
    await createMutation.mutateAsync(values);
    form.resetFields();
    setOpen(false);
  };

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

  const caseRows = casesQuery.data;

  return (
    <>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t("cases")}
        </Typography.Title>
        <Button type="primary" onClick={() => setOpen(true)}>
          Create Case
        </Button>
      </Space>

      <Space wrap style={{ marginBottom: 16, width: "100%" }}>
        <Input.Search
          value={search}
          allowClear
          placeholder={t("searchPlaceholder")}
          style={{ width: 280 }}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: "draft", label: "draft" },
            { value: "in_progress", label: "in_progress" },
            { value: "submitted", label: "submitted" },
            { value: "completed", label: "completed" },
            { value: "rejected", label: "rejected" },
          ]}
        />
        <Input
          allowClear
          placeholder="Case type contains…"
          style={{ width: 200 }}
          value={draftCaseType}
          onChange={(e) => setDraftCaseType(e.target.value)}
          onPressEnter={() => {
            setAppliedCaseType(draftCaseType.trim());
            setPage(1);
          }}
        />
        <Button
          type="primary"
          onClick={() => {
            setAppliedCaseType(draftCaseType.trim());
            setPage(1);
          }}
        >
          Apply
        </Button>
        <Button
          onClick={() => {
            setSearch("");
            setStatusFilter(undefined);
            setDraftCaseType("");
            setAppliedCaseType("");
            setPage(1);
          }}
        >
          Clear Filters
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={casesQuery.isLoading}
        dataSource={caseRows?.items ?? []}
        pagination={{
          current: page,
          pageSize,
          total: caseRows?.total ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: "ID",
            width: 72,
            render: (_, record: CaseItem) => (
              <Link to={`/cases/${record.id}`}>{record.id}</Link>
            ),
          },
          { title: t("clients"), render: (_, record: CaseItem) => record.client?.name ?? "-" },
          { title: "Case Type", dataIndex: "caseType" },
          {
            title: "Status",
            render: (_, record: CaseItem) => (
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
                    { value: "submitted", label: <Tag color="gold">submitted</Tag> },
                    { value: "completed", label: <Tag color="green">completed</Tag> },
                    { value: "rejected", label: <Tag color="red">rejected</Tag> },
                  ]}
                />
              </Popconfirm>
            ),
          },
        ]}
      />
      <Modal title="Create Case" open={open} onCancel={() => setOpen(false)} onOk={onCreate}>
        <Form form={form} layout="vertical" initialValues={{ status: "draft" }}>
          <Form.Item name="clientId" label={t("clients")} rules={[{ required: true, message: "Client is required" }]}>
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                style={{ flex: 1 }}
                showSearch
                optionFilterProp="label"
                value={form.getFieldValue("clientId")}
                options={(clientsQuery.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
                onChange={(v) => {
                  form.setFieldValue("clientId", v);
                }}
              />
              <Tooltip title="Add client">
                <Button type="default" icon={<PlusOutlined />} onClick={() => setClientModalOpen(true)} />
              </Tooltip>
            </div>
          </Form.Item>
          <Form.Item name="caseType" label="Case Type" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "draft" },
                { value: "in_progress" },
                { value: "submitted" },
                { value: "completed" },
                { value: "rejected" },
              ]}
            />
          </Form.Item>
          <Form.Item name="propertyDetails" label="Property Details" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="notes" label="Notes" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
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
