import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Col,
  Select,
  Space,
  Table,
  Tabs,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import JoditEditor from "jodit-react";
import { api, unwrapPaged } from "../api";
import type { Template, TemplateField } from "../types";

type FormValues = {
  name: string;
  language: "en" | "ur";
  content: string;
  fields: TemplateField[];
};

const defaultField = (): TemplateField => ({
  name: "",
  label: "",
  section: "client",
  input: "text",
});

function normalizeFields(raw: unknown): TemplateField[] {
  if (!Array.isArray(raw)) return [defaultField()];
  const list = raw
    .filter(
      (x): x is Record<string, unknown> => x !== null && typeof x === "object",
    )
    .map((x) => ({
      name: String(x.name ?? ""),
      label: String(x.label ?? ""),
      section: (x.section as TemplateField["section"]) ?? "client",
      input: (x.input as TemplateField["input"]) ?? "text",
    }))
    .filter((f) => f.name && f.label);
  return list.length ? list : [defaultField()];
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [editForm] = Form.useForm<FormValues>();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const templatesQuery = useQuery({
    queryKey: ["templates", "list", page, pageSize, search],
    queryFn: () =>
      unwrapPaged<Template>(
        api.get("/templates", {
          params: { page, pageSize, search: search || undefined },
        }),
      ),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      content: string;
      fields: TemplateField[];
    }) => api.post("/templates", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      form.resetFields();
      form.setFieldsValue({ fields: [defaultField()] });
      message.success("Template created.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; content: string; fields: TemplateField[] };
    }) => api.put(`/templates/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setEditOpen(false);
      setEditing(null);
      editForm.resetFields();
      message.success("Template updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      message.success("Template and related generated documents removed.");
    },
    onError: () => message.error("Could not delete template."),
  });

  useEffect(() => {
    if (!editOpen || !editing) return;
    editForm.setFieldsValue({
      name: editing.name,
      language: editing.language ?? "ur",
      content: editing.content,
      fields: normalizeFields(editing.fields),
    });
  }, [editOpen, editing, editForm]);

  const createLang = Form.useWatch("language", form) || "ur";
  const editLang = Form.useWatch("language", editForm) || "ur";

  const createJoditConfig = useMemo(() => ({
    readonly: false,
    height: 500,
    direction: (createLang === "en" ? "ltr" : "rtl") as "ltr" | "rtl",
    language: createLang,
    style: {
      fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif',
    },
    uploader: { insertImageAsBase64URI: true },
    defaultActionOnPaste: "insert_clear_html",
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    placeholder: "Use {{field_name}} tokens matching the field keys below. Urdu / اردو is supported."
  }), [createLang]);

  const editJoditConfig = useMemo(() => ({
    readonly: false,
    height: 500,
    direction: (editLang === "en" ? "ltr" : "rtl") as "ltr" | "rtl",
    language: editLang,
    style: {
      fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif',
    },
    uploader: { insertImageAsBase64URI: true },
    defaultActionOnPaste: "insert_clear_html",
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    placeholder: "Use {{field_name}} tokens matching the field keys below. Urdu / اردو is supported."
  }), [editLang]);

  const buildPayload = (values: FormValues) => {
    const fields = (values.fields ?? [])
      .map((f) => ({
        name: f.name.trim(),
        label: f.label.trim(),
        section: f.section ?? "general",
        input: f.input ?? "text",
      }))
      .filter((f) => f.name && f.label);
    return {
      name: values.name.trim(),
      language: values.language || "ur",
      content: values.content.normalize("NFC"),
      fields,
    };
  };

  const onFinishCreate = async (values: FormValues) => {
    const { name, content, fields } = buildPayload(values);
    if (fields.length === 0) {
      message.error("Add at least one form field with key and label.");
      return;
    }
    await createMutation.mutateAsync({ name, content, fields });
  };

  const onFinishEdit = async (values: FormValues) => {
    if (!editing) return;
    const { name, content, fields } = buildPayload(values);
    if (fields.length === 0) {
      message.error("Add at least one form field with key and label.");
      return;
    }
    await updateMutation.mutateAsync({
      id: editing.id,
      payload: { name, content, fields },
    });
  };

  const openEdit = (row: Template) => {
    setEditing(row);
    setEditOpen(true);
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Templates
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Create legal document templates with placeholder tokens in the content
        (e.g. <code>{"{{client_name}}"}</code>) and define form fields for the
        Document Generator.
      </Typography.Paragraph>

      <Tabs defaultActiveKey="create" items={[
        {
          key: 'create',
          label: 'Create template',
          children: (
            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ fields: [defaultField()], language: "ur" }}
          onFinish={onFinishCreate}
        >
          <Row gutter={16}>
            <Col xs={24} sm={16} md={18}>
              <Form.Item
                name="name"
                label="Template name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input placeholder="e.g. Mukhtaar Nama" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item
                name="language"
                label="Language / Typing Direction"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "ur", label: "Urdu (Right-to-Left)" },
                    { value: "en", label: "English (Left-to-Right)" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="Content (with placeholders)"
            rules={[{ required: true, message: "Content required" }]}
          >
            <JoditEditor config={createJoditConfig} />
          </Form.Item>

          <Typography.Title level={5}>Form fields</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
            Each field becomes an input in Document Generator. <code>name</code>{" "}
            must match placeholders in content.
          </Typography.Paragraph>

          <Form.List name="fields">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 12 }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space wrap style={{ width: "100%" }} align="start">
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        label="Key (placeholder)"
                        rules={[{ required: true }]}
                      >
                        <Input
                          placeholder="client_name"
                          style={{ width: 160 }}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "label"]}
                        label="Label"
                        rules={[{ required: true }]}
                      >
                        <Input
                          placeholder="Full Legal Name"
                          style={{ width: 200 }}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "section"]}
                        label="Section"
                        initialValue="client"
                      >
                        <Select
                          style={{ width: 140 }}
                          options={[
                            { value: "client", label: "Client" },
                            { value: "transaction", label: "Transaction" },
                            { value: "general", label: "General" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "input"]}
                        label="Input"
                        initialValue="text"
                      >
                        <Select
                          style={{ width: 120 }}
                          options={[
                            { value: "text", label: "Text" },
                            { value: "textarea", label: "Text area" },
                            { value: "date", label: "Date" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item label=" ">
                        <Button
                          danger
                          type="text"
                          onClick={() => remove(name)}
                          disabled={fields.length <= 1}
                        >
                          Remove
                        </Button>
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add(defaultField())}
                  block
                  icon={<PlusOutlined />}
                >
                  Add field
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              size="large"
              style={{ minWidth: 160 }}
            >
              Save template
            </Button>
          </Form.Item>
        </Form>
      </Card>
          )
        },
        {
          key: 'view',
          label: 'Existing templates',
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Space style={{ marginBottom: 16 }}>
          <Input.Search
            value={search}
            allowClear
            placeholder="Search template name or body…"
            style={{ width: 320 }}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <Button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </Space>
        <Table
          rowKey="id"
          dataSource={templatesQuery.data?.items ?? []}
          loading={templatesQuery.isLoading}
          pagination={{
            current: page,
            pageSize,
            total: templatesQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          columns={[
            { title: "Name", dataIndex: "name" },
            {
              title: "Fields",
              render: (_, r: Template) =>
                Array.isArray(r.fields) ? r.fields.length : 0,
            },
            {
              title: "Created",
              render: (_, r: Template) =>
                new Date(r.createdAt).toLocaleString(),
            },
            {
              title: "Actions",
              width: 140,
              render: (_, r: Template) => (
                <Space>
                  <Tooltip title="Edit">
                    <EditOutlined
                      style={{
                        fontSize: 16,
                        color: "#6366f1",
                        cursor: "pointer",
                      }}
                      onClick={() => openEdit(r)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete template?"
                    description="All generated documents that use this template will also be deleted."
                    onConfirm={() => deleteMutation.mutate(r.id)}
                  >
                    <Tooltip title="Delete">
                      <DeleteOutlined
                        style={{
                          fontSize: 16,
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
          )
        }
      ]} />

      <Modal
        title="Edit template"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
          editForm.resetFields();
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={onFinishEdit}>
          <Row gutter={16}>
            <Col xs={24} sm={16} md={18}>
              <Form.Item
                name="name"
                label="Template name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Form.Item
                name="language"
                label="Language / Typing Direction"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "ur", label: "Urdu (Right-to-Left)" },
                    { value: "en", label: "English (Left-to-Right)" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="Content (with placeholders)"
            rules={[{ required: true }]}
          >
            <JoditEditor config={editJoditConfig} />
          </Form.Item>
          <Typography.Title level={5}>Form fields</Typography.Title>
          <Form.List name="fields">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 12 }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space wrap style={{ width: "100%" }} align="start">
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        label="Key"
                        rules={[{ required: true }]}
                      >
                        <Input style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "label"]}
                        label="Label"
                        rules={[{ required: true }]}
                      >
                        <Input style={{ width: 180 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "section"]}
                        label="Section"
                      >
                        <Select
                          style={{ width: 120 }}
                          options={[
                            { value: "client", label: "Client" },
                            { value: "transaction", label: "Transaction" },
                            { value: "general", label: "General" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "input"]}
                        label="Input"
                      >
                        <Select
                          style={{ width: 100 }}
                          options={[
                            { value: "text", label: "Text" },
                            { value: "textarea", label: "Area" },
                            { value: "date", label: "Date" },
                          ]}
                        />
                      </Form.Item>
                      <Button
                        danger
                        type="text"
                        onClick={() => remove(name)}
                        disabled={fields.length <= 1}
                      >
                        Remove
                      </Button>
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add(defaultField())}
                  block
                  icon={<PlusOutlined />}
                >
                  Add field
                </Button>
              </>
            )}
          </Form.List>
          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
            >
              Save changes
            </Button>
            <Button
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
