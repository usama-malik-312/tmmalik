import { useQuery } from "@tanstack/react-query";
import { Card, Table, Typography } from "antd";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { ActivityItem } from "../types";
import dayjs from "dayjs";
import { describeActivity, performerLabel } from "../utils/activityLabels";

export default function ActivityPage() {
  const query = useQuery({
    queryKey: ["activities", "recent"],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: ActivityItem[] }>("/activities", {
        params: { limit: 100 },
      });
      return data.data;
    },
  });

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Activity
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Recent actions logged across the system. Open a specific case from{" "}
        <Link to="/cases">Cases</Link> for the full timeline on that file.
      </Typography.Paragraph>

      <Card style={{ borderRadius: 12 }}>
        <Table<ActivityItem>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data ?? []}
          pagination={{ pageSize: 20 }}
          columns={[
            {
              title: "When",
              width: 180,
              render: (_, r) => dayjs(r.createdAt).format("YYYY-MM-DD HH:mm:ss"),
            },
            {
              title: "By",
              width: 160,
              ellipsis: true,
              render: (_, r) => performerLabel(r),
            },
            {
              title: "Action",
              render: (_, r) => describeActivity(r),
            },
            {
              title: "Entity",
              width: 140,
              render: (_, r) => `${r.entityType} #${r.entityId}`,
            },
            {
              title: "Open",
              width: 140,
              render: (_, r) => {
                if (r.entityType === "case") {
                  return <Link to={`/cases/${r.entityId}`}>Case</Link>;
                }
                if (r.entityType === "client") {
                  return <Link to="/clients">Clients</Link>;
                }
                if (r.entityType === "template") {
                  return <Link to="/templates">Templates</Link>;
                }
                if (r.entityType === "document") {
                  return <Link to="/documents">Documents</Link>;
                }
                return "—";
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
