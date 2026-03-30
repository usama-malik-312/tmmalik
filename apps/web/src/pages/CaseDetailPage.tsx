import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Select, Space, Spin, Timeline, Typography } from "antd";
import dayjs from "dayjs";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { ActivityItem, CaseItem, CaseStatus } from "../types";
import { describeActivity, performerLabel } from "../utils/activityLabels";

export default function CaseDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const queryClient = useQueryClient();

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

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <Typography.Text type="danger">Invalid case id.</Typography.Text>
    );
  }

  const c = caseQuery.data;

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
                <Typography.Text type="secondary">Notes</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 0 }}>{c.notes}</Typography.Paragraph>
              </div>
            </Space>
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
