import { FileTextOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, unwrap } from "../api";
import type { CaseItem, Client, GeneratedDocument, Template, TemplateField } from "../types";

function parseTemplateFields(raw: unknown): TemplateField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
    .map((x) => ({
      name: String(x.name ?? ""),
      label: String(x.label ?? x.name ?? ""),
      section: (x.section as TemplateField["section"]) ?? "general",
      input: (x.input as TemplateField["input"]) ?? "text",
    }))
    .filter((f) => f.name.length > 0 && f.label.length > 0);
}

function normalizeTemplate(t: Template & { fields?: unknown }): Template {
  return {
    ...t,
    fields: parseTemplateFields(t.fields),
  };
}

const PRIMARY = "#6366f1";

const SECTION_LABEL: Record<string, string> = {
  client: "CLIENT DETAILS",
  transaction: "TRANSACTION DETAILS",
  general: "ADDITIONAL DETAILS",
};

function templateSubtitle(name: string): string {
  if (/mukhtaar/i.test(name)) return "Power of Attorney";
  if (/iqrar/i.test(name)) return "Affidavit / Agreement";
  return "";
}

function sortFields(fields: TemplateField[]): TemplateField[] {
  const order: Record<string, number> = { client: 0, transaction: 1, general: 2 };
  return [...fields].sort((a, b) => (order[a.section ?? "general"] ?? 2) - (order[b.section ?? "general"] ?? 2));
}

function groupBySection(fields: TemplateField[]): { section: string; fields: TemplateField[] }[] {
  const sorted = sortFields(fields);
  const map = new Map<string, TemplateField[]>();
  for (const f of sorted) {
    const s = f.section ?? "general";
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(f);
  }
  return Array.from(map.entries()).map(([section, list]) => ({ section, fields: list }));
}

function formatDayjsLike(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object" && raw !== null && typeof (raw as { format?: (f: string) => string }).format === "function") {
    return (raw as { format: (f: string) => string }).format("MM/DD/YYYY");
  }
  return null;
}

function renderPreviewContent(content: string, values: Record<string, string>) {
  const parts: ReactNode[] = [];
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      parts.push(<span key={`t${key++}`}>{content.slice(last, m.index)}</span>);
    }
    const tokenName = m[1].trim();
    const val = values[tokenName];
    parts.push(
      <strong key={`v${key++}`} style={{ fontWeight: 700 }}>
        {val?.trim() ? val : "______"}
      </strong>
    );
    last = re.lastIndex;
  }
  parts.push(<span key={`t${key++}`}>{content.slice(last)}</span>);
  return parts;
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const list = await unwrap<Template[]>(api.get("/templates"));
      return list.map((t) => normalizeTemplate(t as Template & { fields?: unknown }));
    },
  });

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => unwrap<Client[]>(api.get("/clients")),
  });

  const casesQuery = useQuery({
    queryKey: ["cases"],
    queryFn: () => unwrap<CaseItem[]>(api.get("/cases")),
  });

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: () => unwrap<GeneratedDocument[]>(api.get("/documents")),
  });

  const generateMutation = useMutation({
    mutationFn: (payload: { templateId: number; caseId?: number | null; formData: Record<string, string> }) =>
      api.post("/documents/generate", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      message.success("Document generated and saved.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Generation failed";
      message.error(msg);
    },
  });

  const templates = templatesQuery.data ?? [];
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (!templates.length) return;
    if (selectedTemplateId == null || !templates.some((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    form.resetFields();
  }, [selectedTemplateId, form]);

  const watched = Form.useWatch([], form) as Record<string, unknown> | undefined;
  const previewValues = useMemo(() => {
    const out: Record<string, string> = {};
    if (!selectedTemplate) return out;
    for (const f of selectedTemplate.fields) {
      const raw = watched?.[f.name];
      if (raw === undefined || raw === null) {
        out[f.name] = "";
      } else {
        const formatted = formatDayjsLike(raw);
        out[f.name] = formatted ?? String(raw);
      }
    }
    return out;
  }, [watched, selectedTemplate]);

  const handleClientSelect = (clientId: number | null) => {
    if (clientId == null) return;
    const client = (clientsQuery.data ?? []).find((c) => c.id === clientId);
    if (!client) return;
    form.setFieldsValue({
      client_name: client.name,
      cnic: client.cnic,
      address: client.address,
    });
  };

  const resetAll = () => {
    form.resetFields();
    setPreviewScale(1);
    message.info("Form reset.");
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      message.warning("Select a template first.");
      return;
    }
    const fieldNames = selectedTemplate.fields.map((f) => f.name);
    await form.validateFields([...fieldNames, "linkedCaseId"]);
    const values = form.getFieldsValue(true) as Record<string, unknown>;
    const formData: Record<string, string> = {};
    for (const f of selectedTemplate.fields) {
      const raw = values[f.name];
      const formatted = formatDayjsLike(raw);
      formData[f.name] = formatted ?? (raw === undefined || raw === null ? "" : String(raw));
    }
    const linked = values.linkedCaseId;
    const caseId =
      linked === undefined || linked === null || linked === ""
        ? null
        : Number(linked);
    await generateMutation.mutateAsync({
      templateId: selectedTemplate.id,
      caseId: Number.isFinite(caseId) ? caseId : null,
      formData,
    });
  };

  const handlePrint = () => window.print();

  const renderFieldInput = (f: TemplateField) => {
    if (f.input === "textarea") {
      return <Input.TextArea rows={4} placeholder={f.label} />;
    }
    if (f.input === "date") {
      return <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" />;
    }
    return <Input placeholder={f.label} />;
  };

  const generator = (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={11}>
        <Card
          bordered={false}
          styles={{ body: { paddingTop: 8 } }}
          title={
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Create Legal Document
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                Complete the sections below; the preview updates as you type.
              </Typography.Text>
            </div>
          }
        >
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            1. Select template
          </Typography.Title>
          <Row gutter={[12, 12]}>
            {templates.map((t) => {
              const active = t.id === selectedTemplateId;
              const sub = templateSubtitle(t.name);
              return (
                <Col span={12} key={t.id}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => setSelectedTemplateId(t.id)}
                    style={{
                      cursor: "pointer",
                      borderWidth: 2,
                      borderColor: active ? PRIMARY : "#e5e7eb",
                      background: active ? "rgba(99, 102, 241, 0.08)" : "#fff",
                      borderRadius: 12,
                    }}
                  >
                    <Space align="start">
                      <FileTextOutlined style={{ fontSize: 22, color: active ? PRIMARY : "#94a3b8", marginTop: 2 }} />
                      <div>
                        <Typography.Text strong style={{ display: "block" }}>
                          {t.name}
                        </Typography.Text>
                        {sub ? (
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {sub}
                          </Typography.Text>
                        ) : null}
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {!selectedTemplate ? (
            <Typography.Paragraph type="secondary">Loading templates…</Typography.Paragraph>
          ) : (
            <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
              <Typography.Title level={5}>2. {SECTION_LABEL.client}</Typography.Title>
              <Typography.Link style={{ display: "block", marginBottom: 12, color: PRIMARY }}>
                Find existing client — select below to auto-fill
              </Typography.Link>
              <Form.Item label="Select existing client">
                <Select
                  allowClear
                  showSearch
                  placeholder="Search by name or CNIC"
                  optionFilterProp="label"
                  options={(clientsQuery.data ?? []).map((c) => ({
                    value: c.id,
                    label: `${c.name} — ${c.cnic}`,
                  }))}
                  onChange={(v) => handleClientSelect(typeof v === "number" ? v : null)}
                />
              </Form.Item>

              {groupBySection(selectedTemplate.fields.filter((f) => (f.section ?? "general") === "client")).map(
                ({ fields }) =>
                  fields.map((f) => (
                    <Form.Item
                      key={f.name}
                      name={f.name}
                      label={f.label}
                      rules={[{ required: true, message: `${f.label} is required` }]}
                    >
                      {renderFieldInput(f)}
                    </Form.Item>
                  ))
              )}

              <Typography.Title level={5}>3. {SECTION_LABEL.transaction}</Typography.Title>
              {groupBySection(selectedTemplate.fields.filter((f) => (f.section ?? "general") === "transaction")).map(
                ({ fields }) =>
                  fields.map((f) => (
                    <Form.Item
                      key={f.name}
                      name={f.name}
                      label={f.label}
                      rules={[{ required: true, message: `${f.label} is required` }]}
                    >
                      {renderFieldInput(f)}
                    </Form.Item>
                  ))
              )}

              {selectedTemplate.fields.some((f) => (f.section ?? "general") === "general") && (
                <>
                  <Typography.Title level={5}>{SECTION_LABEL.general}</Typography.Title>
                  {groupBySection(selectedTemplate.fields.filter((f) => (f.section ?? "general") === "general")).map(
                    ({ fields }) =>
                      fields.map((f) => (
                        <Form.Item
                          key={f.name}
                          name={f.name}
                          label={f.label}
                          rules={[{ required: true, message: `${f.label} is required` }]}
                        >
                          {renderFieldInput(f)}
                        </Form.Item>
                      ))
                  )}
                </>
              )}

              <Form.Item name="linkedCaseId" label="Link to case (optional)">
                <Select
                  allowClear
                  placeholder="Optional — associate with a case"
                  options={(casesQuery.data ?? []).map((c) => ({
                    value: c.id,
                    label: `Case #${c.id} — ${c.client?.name ?? "Unknown"} (${c.caseType})`,
                  }))}
                />
              </Form.Item>

              <Space wrap size="middle" style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerate}
                  loading={generateMutation.isPending}
                  style={{ minWidth: 200 }}
                >
                  Generate document
                </Button>
                <Button size="large" onClick={resetAll}>
                  Reset form
                </Button>
              </Space>
            </Form>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={13}>
        <Card
          title="Live preview"
          bordered={false}
          extra={
            <Space wrap className="no-print">
              <Button size="small" onClick={() => setPreviewScale((s) => Math.min(1.35, s + 0.1))}>
                +
              </Button>
              <Button size="small" onClick={() => setPreviewScale((s) => Math.max(0.75, s - 0.1))}>
                −
              </Button>
              <Button size="small" onClick={handlePrint}>
                Print
              </Button>
              <Button size="small" type="primary" ghost onClick={handlePrint}>
                Download PDF
              </Button>
            </Space>
          }
        >
          <div className="no-print" style={{ marginBottom: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "#1e293b",
                color: "#e2e8f0",
                fontSize: 13,
              }}
            >
              <span style={{ color: "#22c55e", fontSize: 10 }}>●</span>
              Real-time sync enabled. Document is current.
            </span>
          </div>
          <div
            ref={printRef}
            id="legal-doc-print-root"
            className="legal-doc-print-outer"
            style={{
              background: "#f0f0f0",
              padding: 24,
              borderRadius: 8,
              minHeight: 640,
              overflow: "hidden",
            }}
          >
            <div
              className="legal-doc-scale-wrap"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: "top center",
                margin: "0 auto",
                maxWidth: "100%",
              }}
            >
              <div
                className="legal-doc-paper-inner"
                style={{
                  width: "100%",
                  maxWidth: 640,
                  margin: "0 auto",
                  background: "#fff",
                  padding: "48px 56px",
                  minHeight: 720,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "#1a1a1a",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {selectedTemplate ? (
                  <div
                    className="legal-doc-body"
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      maxWidth: "100%",
                      overflowX: "hidden",
                    }}
                  >
                    {renderPreviewContent(selectedTemplate.content, previewValues)}
                  </div>
                ) : (
                  <Typography.Paragraph type="secondary">Select a template to preview.</Typography.Paragraph>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );

  return (
    <>
      <style>{`
        .legal-doc-body strong {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        @media print {
          @page {
            margin: 16mm 14mm;
            size: auto;
          }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #legal-doc-print-root,
          #legal-doc-print-root * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          #legal-doc-print-root.legal-doc-print-outer {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            border-radius: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
          #legal-doc-print-root .legal-doc-scale-wrap {
            transform: none !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          #legal-doc-print-root .legal-doc-paper-inner {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 10mm !important;
            min-height: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          #legal-doc-print-root .legal-doc-body {
            white-space: pre-wrap !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            overflow: visible !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <Tabs
        items={[
          { key: "generator", label: "Document Generator", children: generator },
          {
            key: "history",
            label: "Generated documents",
            children: (
              <Table
                rowKey="id"
                dataSource={documentsQuery.data ?? []}
                columns={[
                  { title: "Template", render: (_, r: GeneratedDocument) => r.template?.name ?? "—" },
                  { title: "Case", render: (_, r: GeneratedDocument) => (r.caseId != null ? `#${r.caseId}` : "—") },
                  {
                    title: "Preview",
                    render: (_, r: GeneratedDocument) => (
                      <Typography.Paragraph ellipsis={{ rows: 2, expandable: true }} style={{ maxWidth: 360 }}>
                        {r.generatedContent}
                      </Typography.Paragraph>
                    ),
                  },
                  {
                    title: "Created",
                    render: (_, r: GeneratedDocument) => new Date(r.createdAt).toLocaleString(),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
