import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Select, Space, Spin, Timeline, Typography, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { ActivityItem, CaseItem, CaseStatus } from "../types";
import { describeActivity, performerLabel } from "../utils/activityLabels";

export default function CaseDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const queryClient = useQueryClient();
  const [noteForm] = Form.useForm<{ notes: string }>();
  const [feeForm] = Form.useForm<{ feeAmount: number; feeType: string }>();

  const caseQuery = useQuery({
    queryKey: ["cases", id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: CaseItem }>(`/cases/${id}`);
      return data.data;
    },
    enabled: Number.isInteger(id) && id > 0,
  });

  const activitiesQuery = useQuery({
    queryKey: ["cases", id, "activities"],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: ActivityItem[] }>(`/cases/${id}/activities`);
      return data.data;
    },
    enabled: Number.isInteger(id) && id > 0,
  });

  const statusMutation = useMutation({
    mutationFn: (status: CaseStatus) => api.put(`/cases/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases", id] });
      queryClient.invalidateQueries({ queryKey: ["cases", id, "activities"] });
      queryClient.invalidateQueries({ queryKey: ["cases", "list"] });
    },
  });
  const notesMutation = useMutation({
    mutationFn: (notes: string) => api.put(`/cases/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases", id] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
      message.success("Internal notes updated.");
    },
  });
  const feeCalcMutation = useMutation({
    mutationFn: (payload: { amount: number; type: string }) => api.post("/automation/fees/calculate", payload),
    onSuccess: (res) => {
      const d = res.data?.data as { amount: number; type: string; stampDuty: number; cvt: number; total: number };
      feeForm.setFieldsValue({ feeAmount: d.amount, feeType: d.type });
      message.success(`Calculated: Stamp ${d.stampDuty}, CVT ${d.cvt}, Total ${d.total}`);
    },
  });
  const feeSaveMutation = useMutation({
    mutationFn: (payload: { feeAmount: number; feeType: string; stampDuty: number; cvt: number; totalFee: number }) =>
      api.put(`/cases/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases", id] });
      queryClient.invalidateQueries({ queryKey: ["activities", "recent"] });
      message.success("Fee tracking saved.");
    },
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <Typography.Text type="danger">Invalid case id.</Typography.Text>
    );
  }

  const c = caseQuery.data;
  useEffect(() => {
    if (!c) return;
    noteForm.setFieldsValue({ notes: c.notes });
    feeForm.setFieldsValue({
      feeAmount: c.feeAmount ?? undefined,
      feeType: c.feeType ?? "general",
    });
  }, [c, noteForm, feeForm]);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space>
        <Link to="/cases">
          <Button type="link" icon={<ArrowLeftOutlined />}>
            Back to cases
          </Button>
        </Link>
      </Space>

      {caseQuery.isLoading ? (
        <Spin />
      ) : caseQuery.isError || !c ? (
        <Typography.Text type="danger">Case not found.</Typography.Text>
      ) : (
        <>
          <Card title="Case overview">
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {c.caseType}
              </Typography.Title>
              <div>
                <Typography.Text type="secondary">Client: </Typography.Text>
                <Typography.Text strong>{c.client?.name ?? "—"}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Status: </Typography.Text>
                <Select
                  value={c.status}
                  style={{ minWidth: 200 }}
                  loading={statusMutation.isPending}
                  onChange={(status: CaseStatus) => statusMutation.mutate(status)}
                  options={[
                    { value: "draft", label: "draft" },
                    { value: "in_progress", label: "in_progress" },
                    { value: "submitted", label: "submitted" },
                    { value: "completed", label: "completed" },
                    { value: "rejected", label: "rejected" },
                  ]}
                />
              </div>
              <div>
                <Typography.Text type="secondary">Property details</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 0 }}>{c.propertyDetails}</Typography.Paragraph>
              </div>
              <div>
                <Typography.Text type="secondary">Internal notes</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 0 }}>{c.notes}</Typography.Paragraph>
              </div>
            </Space>
          </Card>
          <Card title="Internal Notes">
            <Form form={noteForm} layout="vertical">
              <Form.Item name="notes" label="Case internal notes" rules={[{ required: true }]}>
                <Input.TextArea rows={5} placeholder="Private office notes for this case..." />
              </Form.Item>
              <Button
                type="primary"
                loading={notesMutation.isPending}
                onClick={async () => {
                  const values = await noteForm.validateFields();
                  await notesMutation.mutateAsync(values.notes);
                }}
              >
                Save notes
              </Button>
            </Form>
          </Card>
          <Card title="Basic Fee Tracking">
            <Form form={feeForm} layout="vertical">
              <Form.Item name="feeAmount" label="Property amount" rules={[{ required: true }]}>
                <Input type="number" min={0} />
              </Form.Item>
              <Form.Item name="feeType" label="Fee type" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "general", label: "general" },
                    { value: "sale", label: "sale" },
                    { value: "transfer", label: "transfer" },
                    { value: "lease", label: "lease" },
                  ]}
                />
              </Form.Item>
              <Space>
                <Button
                  onClick={async () => {
                    const values = await feeForm.validateFields();
                    const { data } = await feeCalcMutation.mutateAsync({
                      amount: Number(values.feeAmount),
                      type: String(values.feeType),
                    });
                    const d = data?.data as { stampDuty: number; cvt: number; total: number };
                    await feeSaveMutation.mutateAsync({
                      feeAmount: Number(values.feeAmount),
                      feeType: String(values.feeType),
                      stampDuty: d.stampDuty,
                      cvt: d.cvt,
                      totalFee: d.total,
                    });
                  }}
                  loading={feeCalcMutation.isPending || feeSaveMutation.isPending}
                >
                  Calculate and save
                </Button>
              </Space>
              <div style={{ marginTop: 12 }}>
                <Typography.Text>Stamp duty: {c.stampDuty ?? 0}</Typography.Text>
                <br />
                <Typography.Text>CVT: {c.cvt ?? 0}</Typography.Text>
                <br />
                <Typography.Text strong>Total: {c.totalFee ?? 0}</Typography.Text>
              </div>
            </Form>
          </Card>

          <Card title="Timeline">
            {activitiesQuery.isLoading ? (
              <Spin />
            ) : (
              <Timeline
                items={(activitiesQuery.data ?? []).map((a) => ({
                  color: "blue",
                  children: (
                    <div>
                      <div>{describeActivity(a)}</div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {performerLabel(a)} · {dayjs(a.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </Typography.Text>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </>
      )}
    </Space>
  );
}
