import { DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, MoreOutlined, PrinterOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  type MenuProps,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import JoditEditor from "jodit-react";
import { api, unwrapPaged } from "../api";
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

function getPreviewContentHTML(content: string, values: Record<string, string>) {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  return content.replace(re, (_, tokenName) => {
    const val = values[tokenName.trim()];
    const text = val?.trim() ? val : "______";
    return `<strong style="font-weight: 700;">${text}</strong>`;
  });
}

function escapeHtmlToEditor(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n|\r|\n/g, "<br>");
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("generator");
  const [previewScale, setPreviewScale] = useState(1);
  const [draftContent, setDraftContent] = useState<string>("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [docPage, setDocPage] = useState(1);
  const [docPageSize, setDocPageSize] = useState(10);
  const [docSearch, setDocSearch] = useState("");
  const [viewDoc, setViewDoc] = useState<GeneratedDocument | null>(null);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);

  const templatesQuery = useQuery({
    queryKey: ["templates", "docgen"],
    queryFn: async () => {
      const p = await unwrapPaged<Template>(api.get("/templates", { params: { page: 1, pageSize: 500 } }));
      return p.items.map((t) => normalizeTemplate(t as Template & { fields?: unknown }));
    },
  });

  const clientsQuery = useQuery({
    queryKey: ["clients", "picker"],
    queryFn: () => unwrapPaged<Client>(api.get("/clients", { params: { page: 1, pageSize: 500 } })),
  });

  const casesQuery = useQuery({
    queryKey: ["cases", "picker"],
    queryFn: () => unwrapPaged<CaseItem>(api.get("/cases", { params: { page: 1, pageSize: 500 } })),
  });

  const documentsQuery = useQuery({
    queryKey: ["documents", "list", docPage, docPageSize, docSearch],
    queryFn: () =>
      unwrapPaged<GeneratedDocument>(
        api.get("/documents", { params: { page: docPage, pageSize: docPageSize, search: docSearch || undefined } })
      ),
  });

  const generateMutation = useMutation({
    mutationFn: (payload: {
      templateId: number;
      caseId?: number | null;
      formData: Record<string, string>;
      contentOverride?: string;
    }) => api.post("/documents/generate", payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      const cid = variables.caseId;
      if (cid != null && Number.isFinite(Number(cid))) {
        queryClient.invalidateQueries({ queryKey: ["cases", Number(cid), "activities"] });
      }
      message.success("Document generated and saved.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Generation failed";
      message.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, generatedContent }: { id: number; generatedContent: string }) =>
      api.put(`/documents/${id}`, { generatedContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      message.success("Document updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      if (editingDocId != null) setEditingDocId(null);
      message.success("Document deleted.");
    },
  });

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLocaleLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLocaleLowerCase().includes(q) ||
        t.content.toLocaleLowerCase().includes(q) ||
        (t.fields ?? []).some((f) => f.label.toLocaleLowerCase().includes(q) || f.name.toLocaleLowerCase().includes(q))
    );
  }, [templates, templateSearch]);

  const effectiveTemplateId = selectedTemplateId ?? templates[0]?.id ?? null;
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === effectiveTemplateId) ?? null,
    [templates, effectiveTemplateId]
  );

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
    const client = (clientsQuery.data?.items ?? []).find((c) => c.id === clientId);
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
    if (selectedTemplate) setDraftContent(selectedTemplate.content);
    setEditingDocId(null);
    message.info("Form reset.");
  };

  const isRtlText = (selectedTemplate?.language ?? "ur") === "ur";
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      height: 400,
      direction: isRtlText ? ("rtl" as const) : ("ltr" as const),
      language: selectedTemplate?.language ?? "ur",
      style: {
        fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif',
        direction: isRtlText ? "rtl" : "ltr",
        textAlign: isRtlText ? "right" : "left",
        unicodeBidi: "plaintext",
      },
      uploader: { insertImageAsBase64URI: true },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      events: {
        paste(this: any, event: ClipboardEvent) {
          const text = event?.clipboardData?.getData("text/plain");
          if (typeof text !== "string") return;
          event.preventDefault();
          this?.selection?.insertHTML?.(escapeHtmlToEditor(text.normalize("NFC")));
          return false;
        },
      },
    }),
    [isRtlText, selectedTemplate?.language]
  );

  const printDocument = (content: string, isRtl: boolean = true) => {
    const rtl = isRtl;
    const html = `<!doctype html><html><head><meta charset="utf-8" />
      <title>Document</title>
      <style>
        @page { size: auto; margin: 0mm; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body { font-family: "Jameel Noori Nastaleeq", "Times New Roman", Times, "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", serif; font-size: 15px; line-height: 1.7; padding: 14mm; }
        .doc { word-break: break-word; overflow-wrap: anywhere; direction: ${rtl ? "rtl" : "ltr"}; text-align: ${rtl ? "right" : "left"}; unicode-bidi: plaintext; }
        .doc table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        .doc th, .doc td { border: 1px solid #000; padding: 8px; }
      </style></head><body><div class="doc">${content}</div></body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      message.error("Unable to start printing.");
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 800);
    }, 150);
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
    const caseId = linked === undefined || linked === null || linked === "" ? null : Number(linked);
    const contentOverride =
      draftContent.trim() !== selectedTemplate.content.trim() ? draftContent : undefined;
    if (editingDocId != null) {
      await updateMutation.mutateAsync({ id: editingDocId, generatedContent: draftContent });
      setEditingDocId(null);
      return;
    }
    await generateMutation.mutateAsync({
      templateId: selectedTemplate.id,
      caseId: Number.isFinite(caseId) ? caseId : null,
      formData,
      contentOverride,
    });
  };

  const handlePrint = () => {
    const body = (draftContent.trim() || selectedTemplate?.content || "").trim();
    if (!body) {
      message.warning("No document content to print.");
      return;
    }
    const htmlToPrint = getPreviewContentHTML(body, previewValues);
    const docLang = selectedTemplate?.language ?? "ur";
    printDocument(htmlToPrint, docLang === "ur");
  };

  const renderFieldInput = (f: TemplateField) => {
    if (f.input === "textarea") {
      return <Input.TextArea rows={4} placeholder={f.label} dir="auto" />;
    }
    if (f.input === "date") {
      return <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" />;
    }
    return <Input placeholder={f.label} dir="auto" />;
  };

  const previewBody = draftContent || selectedTemplate?.content || "";

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
          <Input.Search
            value={templateSearch}
            allowClear
            placeholder="Search templates by name or text…"
            style={{ marginBottom: 12 }}
            onChange={(e) => setTemplateSearch(e.target.value)}
          />
          <Button
            style={{ marginBottom: 12 }}
            onClick={() => {
              setTemplateSearch("");
            }}
          >
            Clear Filters
          </Button>
          <Row gutter={[12, 12]}>
            {filteredTemplates.map((t) => {
              const active = t.id === effectiveTemplateId;
              const sub = templateSubtitle(t.name);
              return (
                <Col span={12} key={t.id}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setDraftContent(t.content);
                      setEditingDocId(null);
                    }}
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
              <Typography.Title level={5}>Document text (optional edits)</Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginTop: -8, fontSize: 13 }}>
                Adjust wording for this run only — the saved template in the library is unchanged. Use the same{" "}
                <code>{"{{placeholders}}"}</code> as in the template.
              </Typography.Paragraph>
              <JoditEditor
                value={previewBody}
                config={editorConfig}
                onBlur={(newContent) => setDraftContent(newContent)}
              />

              <Typography.Title level={5} style={{ marginTop: 16 }}>
                2. {SECTION_LABEL.client}
              </Typography.Title>
              <Typography.Link style={{ display: "block", marginBottom: 12, color: PRIMARY }}>
                Find existing client — select below to auto-fill
              </Typography.Link>
              <Form.Item label="Select existing client">
                <Select
                  allowClear
                  showSearch
                  placeholder="Search by name or CNIC"
                  optionFilterProp="label"
                  options={(clientsQuery.data?.items ?? []).map((c) => ({
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
                  options={(casesQuery.data?.items ?? []).map((c) => ({
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
                  loading={generateMutation.isPending || updateMutation.isPending}
                  style={{ minWidth: 200 }}
                >
                  {editingDocId != null ? "Save document changes" : "Generate document"}
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
            id="legal-doc-print-root"
            className="legal-doc-print-outer"
            style={{
              background: "#f0f0f0",
              padding: 24,
              borderRadius: 8,
              minHeight: 320,
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
                  minHeight: 400,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  fontFamily: '"Jameel Noori Nastaleeq", "Times New Roman", Times, "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", serif',
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "#1a1a1a",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  direction: isRtlText ? "rtl" : "ltr",
                  textAlign: isRtlText ? "right" : "left",
                }}
              >
                {selectedTemplate ? (
                  <div
                    className="legal-doc-body"
                    style={{
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      maxWidth: "100%",
                      overflowX: "hidden",
                      unicodeBidi: "plaintext",
                    }}
                    dangerouslySetInnerHTML={{ __html: getPreviewContentHTML(previewBody, previewValues) }}
                  />
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

  const docPaged = documentsQuery.data;

  return (
    <>
      <style>{`
        .legal-doc-body strong {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .legal-doc-body,
        .legal-doc-body * {
          font-family: "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif !important;
        }
        .legal-doc-body table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .legal-doc-body th, .legal-doc-body td {
          border: 1px solid #000;
          padding: 8px;
        }
        @media print {
          @page {
            margin: 12mm 14mm;
            size: A4 portrait;
          }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            border-radius: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            z-index: 99999 !important;
          }
          #legal-doc-print-root .legal-doc-scale-wrap {
            transform: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          #legal-doc-print-root .legal-doc-paper-inner {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            min-height: 0 !important;
            box-shadow: none !important;
            page-break-inside: auto;
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
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "generator", label: "Document Generator", children: generator },
          {
            key: "history",
            label: "Generated documents",
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input.Search
                    value={docSearch}
                    allowClear
                    placeholder="Search documents or template name…"
                    style={{ width: 360 }}
                    onChange={(e) => setDocSearch(e.target.value)}
                    onSearch={(v) => {
                      setDocSearch(v);
                      setDocPage(1);
                    }}
                  />
                  <Button
                    onClick={() => {
                      setDocSearch("");
                      setDocPage(1);
                      setDocPageSize(10);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Space>
                <Table
                  rowKey="id"
                  loading={documentsQuery.isLoading}
                  dataSource={docPaged?.items ?? []}
                  pagination={{
                    current: docPage,
                    pageSize: docPageSize,
                    total: docPaged?.total ?? 0,
                    showSizeChanger: true,
                    onChange: (p, ps) => {
                      setDocPage(p);
                      setDocPageSize(ps);
                    },
                  }}
                  columns={[
                    { title: "Template", render: (_, r: GeneratedDocument) => r.template?.name ?? "—" },
                    { title: "Case", render: (_, r: GeneratedDocument) => (r.caseId != null ? `#${r.caseId}` : "—") },
                    {
                      title: "Preview",
                      render: (_, r: GeneratedDocument) => {
                        const plainText = r.generatedContent.replace(/<[^>]+>/g, ' ');
                        return (
                          <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ maxWidth: 280, margin: 0 }}>
                            {plainText}
                          </Typography.Paragraph>
                        );
                      },
                    },
                    {
                      title: "Actions",
                      width: 90,
                      render: (_, r: GeneratedDocument) => {
                        const items: MenuProps["items"] = [
                          {
                            key: "view",
                            icon: <EyeOutlined />,
                            label: "View",
                          },
                          {
                            key: "edit",
                            icon: <EditOutlined />,
                            label: "Edit",
                          },
                          {
                            key: "print",
                            icon: <PrinterOutlined />,
                            label: "Print",
                          },
                          {
                            type: "divider",
                          },
                          {
                            key: "delete",
                            icon: <DeleteOutlined />,
                            danger: true,
                            label: "Delete",
                          },
                        ];
                        return (
                          <Dropdown
                            trigger={["click"]}
                            menu={{
                              items,
                              onClick: ({ key }) => {
                                if (key === "view") {
                                  setViewDoc(r);
                                  return;
                                }
                                if (key === "edit") {
                                  setSelectedTemplateId(r.templateId);
                                  setDraftContent(r.generatedContent);
                                  setEditingDocId(r.id);
                                  setActiveTab("generator");
                                  return;
                                }
                                if (key === "print") {
                                  printDocument(r.generatedContent);
                                  return;
                                }
                                if (key === "delete") {
                                  void deleteMutation.mutateAsync(r.id);
                                }
                              },
                            }}
                          >
                            <Button type="text" icon={<MoreOutlined />} />
                          </Dropdown>
                        );
                      },
                    },
                    {
                      title: "Created",
                      render: (_, r: GeneratedDocument) => new Date(r.createdAt).toLocaleString(),
                    },
                  ]}
                />
                <Modal
                  title={viewDoc ? `Document — ${viewDoc.template?.name ?? "Generated"}` : "Document"}
                  open={viewDoc != null}
                  footer={null}
                  width={720}
                  onCancel={() => setViewDoc(null)}
                  destroyOnClose
                >
                  {viewDoc ? (
                    <Typography.Paragraph
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: "70vh",
                        overflow: "auto",
                        fontFamily: '"Times New Roman", Times, serif',
                        marginBottom: 0,
                      }}
                    >
                      {viewDoc.generatedContent}
                    </Typography.Paragraph>
                  ) : null}
                </Modal>
              </>
            ),
          },
        ]}
      />
    </>
  );
}
