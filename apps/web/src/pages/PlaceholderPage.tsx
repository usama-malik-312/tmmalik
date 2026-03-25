import { Card, Typography } from "antd";

export default function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <Card style={{ maxWidth: 640, borderRadius: 12 }}>
        <Typography.Title level={3}>{title}</Typography.Title>
        {subtitle && <Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>}
      </Card>
    </div>
  );
}
