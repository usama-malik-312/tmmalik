import { useQuery } from "@tanstack/react-query";
import { Card, Col, List, Row, Statistic, Tag, Typography } from "antd";
import { api, unwrap } from "../api";
import type { CaseItem, Client } from "../types";

export default function DashboardPage() {
  const clientsQuery = useQuery({ queryKey: ["clients"], queryFn: () => unwrap<Client[]>(api.get("/clients")) });
  const casesQuery = useQuery({ queryKey: ["cases"], queryFn: () => unwrap<CaseItem[]>(api.get("/cases")) });
  const recentCases = (casesQuery.data ?? []).slice(0, 5);

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}><Card><Statistic title="Total Clients" value={clientsQuery.data?.length ?? 0} /></Card></Col>
      <Col span={12}><Card><Statistic title="Total Cases" value={casesQuery.data?.length ?? 0} /></Card></Col>
      <Col span={24}>
        <Card title="Recent Cases">
          <List dataSource={recentCases} renderItem={(item) => (
            <List.Item>
              <Typography.Text>{item.caseType}</Typography.Text>
              <Tag>{item.status}</Tag>
              <Typography.Text type="secondary">{item.client?.name ?? "Unknown"}</Typography.Text>
            </List.Item>
          )} />
        </Card>
      </Col>
    </Row>
  );
}
