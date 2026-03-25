import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography } from "antd";
import { useState } from "react";
import { api, unwrap } from "../api";
import type { User } from "../types";

type UserForm = Omit<User, "id" | "createdAt"> & { password: string };

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm<UserForm>();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => unwrap<User[]>(api.get("/users")),
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserForm) => api.post("/users", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UserForm> }) => api.put(`/users/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Users
        </Typography.Title>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add User
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={usersQuery.data ?? []}
        columns={[
          { title: "First Name", dataIndex: "fname" },
          { title: "Last Name", dataIndex: "lname" },
          { title: "Email", dataIndex: "email" },
          { title: "Address", dataIndex: "address" },
          {
            title: "User Type",
            render: (_, u: User) => (u.userType === -1 ? "Owner" : u.userType === 1 ? "Manager" : "Staff"),
          },
          {
            title: "Actions",
            render: (_, u: User) => (
              <Space>
                <Button
                  onClick={() => {
                    setEditing(u);
                    form.setFieldsValue({ ...u, password: "" });
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Popconfirm title="Delete user?" onConfirm={() => deleteMutation.mutate(u.id)}>
                  <Button danger>Delete</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? "Edit User" : "Create User"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={onSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="fname" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lname" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: !editing, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="userType" label="User Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 1, label: "Manager" },
                { value: 2, label: "Staff" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

