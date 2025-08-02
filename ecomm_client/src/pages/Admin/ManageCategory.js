import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Typography,
  Space,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import categoryApi from "../../api/categoryApi";

const { Title } = Typography;
const { Option } = Select;

const ManageCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getAll();
      // Ensure we get the array from the response structure
      const categoriesData = response?.data?.data || response?.data || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      message.error("Failed to fetch categories");
      console.error("Error fetching categories:", error);
      setCategories([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle create/update category
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory._id, values);
        message.success("Category updated successfully");
      } else {
        await categoryApi.create(values);
        message.success("Category created successfully");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      message.error(
        editingCategory
          ? "Failed to update category"
          : "Failed to create category"
      );
      console.error("Error saving category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete category
  const handleDelete = async (id) => {
    try {
      await categoryApi.delete(id);
      message.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      message.error("Failed to delete category");
      console.error("Error deleting category:", error);
    }
  };

  // Handle edit category
  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      parent_id: category.parent_id?._id || undefined,
    });
    setModalVisible(true);
  };

  // Handle add new category
  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle modal cancel
  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingCategory(null);
  };

  // Get parent categories for select dropdown
  const getParentCategories = () => {
    if (!Array.isArray(categories)) {
      return [];
    }
    return categories.filter((cat) => !cat.parent_id);
  };

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <TagsOutlined style={{ color: "#1890ff" }} />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: "Parent Category",
      dataIndex: ["parent_id", "name"],
      key: "parent",
      render: (text) => {
        return text ? (
          <Tag color="blue">{text}</Tag>
        ) : (
          <Tag color="default">Root Category</Tag>
        );
      },
    },
    {
      title: "Type",
      key: "type",
      render: (_, record) => {
        return record.parent_id ? (
          <Tag color="green">Subcategory</Tag>
        ) : (
          <Tag color="purple">Main Category</Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              type="primary"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex items-center gap-3">
            <TagsOutlined className="text-2xl text-blue-500" />
            <Title level={3} className="m-0">
              Manage Categories
            </Title>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
            className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
          >
            Add Category
          </Button>
        }
        className="shadow-lg"
      >
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} categories`,
          }}
          className="mt-4"
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TagsOutlined />
            {editingCategory ? "Edit Category" : "Add New Category"}
          </div>
        }
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6"
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              {
                required: true,
                message: "Please enter category name",
              },
              {
                min: 2,
                message: "Category name must be at least 2 characters",
              },
              {
                max: 50,
                message: "Category name must not exceed 50 characters",
              },
            ]}
          >
            <Input
              placeholder="Enter category name"
              size="large"
              className="rounded-md"
            />
          </Form.Item>

          <Form.Item
            name="parent_id"
            label="Parent Category"
            tooltip="Select a parent category to create a subcategory, or leave empty for a main category"
          >
            <Select
              placeholder="Select parent category (optional)"
              size="large"
              allowClear
              className="rounded-md"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {getParentCategories().map((category) => (
                <Option key={category._id} value={category._id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={handleCancel} size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {editingCategory ? "Update" : "Create"} Category
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageCategory;
