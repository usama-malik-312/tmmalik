import { useQuery } from "@tanstack/react-query";
import { Card, Col, List, Row, Statistic, Tag, Typography } from "antd";
import { api, unwrapPaged } from "../api";
import { useI18n } from "../contexts/I18nContext";
import type { CaseItem, Client } from "../types";

export default function DashboardPage() {
  const { t } = useI18n();
  const clientsCountQuery = useQuery({
    queryKey: ["clients", "count"],
    queryFn: () => unwrapPaged<Client>(api.get("/clients", { params: { page: 1, pageSize: 1 } })),
  });
  const casesCountQuery = useQuery({
    queryKey: ["cases", "count"],
    queryFn: () => unwrapPaged<CaseItem>(api.get("/cases", { params: { page: 1, pageSize: 1 } })),
  });
  const recentCasesQuery = useQuery({
    queryKey: ["cases", "recent"],
    queryFn: () => unwrapPaged<CaseItem>(api.get("/cases", { params: { page: 1, pageSize: 5 } })),
  });

  const recentCases = recentCasesQuery.data?.items ?? [];

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card>
          <Statistic title={t("clients")} value={clientsCountQuery.data?.total ?? 0} />
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <Statistic title={t("cases")} value={casesCountQuery.data?.total ?? 0} />
        </Card>
      </Col>
      <Col span={24}>
        <Card title={t("activity")}>
          <List
            loading={recentCasesQuery.isLoading}
            dataSource={recentCases}
            renderItem={(item) => (
              <List.Item>
                <Typography.Text>{item.caseType}</Typography.Text>
                <Tag>{item.status}</Tag>
                <Typography.Text type="secondary">{item.client?.name ?? "-"}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}
