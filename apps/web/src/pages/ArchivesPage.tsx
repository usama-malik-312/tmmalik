import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Select, Space, Table, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { useState } from "react";
import { api, unwrapPaged } from "../api";
import type { ArchiveItem, Client } from "../types";

type UploadFormValues = {
  title: string;
  documentType: string;
  clientId?: number;
  cnic?: string;
  name?: string;
};

export default function ArchivesPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<UploadFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cnic, setCnic] = useState("");
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("");

  const clientsQuery = useQuery({
    queryKey: ["clients", "archive-picker"],
    queryFn: () => unwrapPaged<Client>(api.get("/clients", { params: { page: 1, pageSize: 500 } })),
  });

  const archivesQuery = useQuery({
    queryKey: ["archives", page, pageSize, cnic, name, documentType],
    queryFn: () =>
      unwrapPaged<ArchiveItem>(
        api.get("/archives", {
          params: {
            page,
            pageSize,
            cnic: cnic || undefined,
            name: name || undefined,
            documentType: documentType || undefined,
          },
        })
      ),
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: UploadFormValues) => {
      if (!fileList[0]?.originFileObj) {
        throw new Error("Please select a file.");
      }
      const body = new FormData();
      body.append("file", fileList[0].originFileObj);
      body.append("title", values.title);
      body.append("documentType", values.documentType);
      if (values.clientId) body.append("clientId", String(values.clientId));
      if (values.cnic) body.append("cnic", values.cnic);
      if (values.name) body.append("name", values.name);
      return api.post("/archives/upload", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      message.success("Archive uploaded.");
      queryClient.invalidateQueries({ queryKey: ["archives"] });
      form.resetFields();
      setFileList([]);
    },
    onError: (err: unknown) => {
      message.error(err instanceof Error ? err.message : "Upload failed");
    },
  });

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Archive / Vault
      </Typography.Title>

      <Form form={form} layout="vertical">
        <Space wrap style={{ width: "100%" }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]} style={{ width: 240 }}>
            <Input />
          </Form.Item>
          <Form.Item name="documentType" label="Document type" rules={[{ required: true }]} style={{ width: 220 }}>
            <Input placeholder="Sale deed, mutation, etc." />
          </Form.Item>
          <Form.Item name="clientId" label="Client (optional)" style={{ width: 260 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={(clientsQuery.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.name} — ${c.cnic}` }))}
            />
          </Form.Item>
          <Form.Item name="cnic" label="CNIC (optional)" style={{ width: 220 }}>
            <Input placeholder="11111-1111111-1" />
          </Form.Item>
          <Form.Item name="name" label="Name (optional)" style={{ width: 220 }}>
            <Input />
          </Form.Item>
          <Form.Item label="Scanned file" required>
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
            >
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
          </Form.Item>
        </Space>
        <Button
          type="primary"
          loading={uploadMutation.isPending}
          onClick={async () => {
            const values = await form.validateFields();
            await uploadMutation.mutateAsync(values);
          }}
        >
          Upload to Vault
        </Button>
      </Form>

      <Space wrap>
        <Input
          allowClear
          value={cnic}
          placeholder="Search by CNIC"
          style={{ width: 200 }}
          onChange={(e) => {
            setCnic(e.target.value);
            setPage(1);
          }}
        />
        <Input
          allowClear
          value={name}
          placeholder="Search by Name"
          style={{ width: 200 }}
          onChange={(e) => {
            setName(e.target.value);
            setPage(1);
          }}
        />
        <Input
          allowClear
          value={documentType}
          placeholder="Search by Document type"
          style={{ width: 220 }}
          onChange={(e) => {
            setDocumentType(e.target.value);
            setPage(1);
          }}
        />
      </Space>

      <Table
        rowKey="id"
        loading={archivesQuery.isLoading}
        dataSource={archivesQuery.data?.items ?? []}
        pagination={{
          current: page,
          pageSize,
          total: archivesQuery.data?.total ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          { title: "Title", dataIndex: "title" },
          { title: "Type", dataIndex: "documentType" },
          { title: "Client", render: (_, r: ArchiveItem) => r.client?.name ?? "—" },
          { title: "Date", render: (_, r: ArchiveItem) => new Date(r.createdAt).toLocaleString() },
          {
            title: "Download",
            render: (_, r: ArchiveItem) => (
              <Button icon={<DownloadOutlined />} onClick={() => window.open(r.fileUrl, "_blank", "noopener,noreferrer")}>
                Download
              </Button>
            ),
          },
        ]}
      />
    </Space>
  );
}
