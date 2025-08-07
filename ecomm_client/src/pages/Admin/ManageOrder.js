import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  Modal,
  message,
  Dropdown,
  Input,
  DatePicker,
  Select,
  Typography,
  Tooltip,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import axiosClient from "../../api/axiosClient";
import OrderDetailModal from "../../components/OrderDetailModal";
import Cookies from "js-cookie";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ManageOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  // Order status mapping
  const orderStatusMap = {
    pending: { color: "orange", text: "Pending" },
    confirmed: { color: "blue", text: "Confirmed" },
    processing: { color: "cyan", text: "Processing" },
    shipped: { color: "purple", text: "Shipped" },
    delivered: { color: "green", text: "Delivered" },
    cancelled: { color: "red", text: "Cancelled" },
    refunded: { color: "volcano", text: "Refunded" },
  };

  const fetchOrders = useCallback(async () => {
    console.log("fetchOrders called with params:", {
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      status: statusFilter !== "all" ? statusFilter : undefined,
      startDate: dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
      endDate: dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
    });
    
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
        endDate: dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
      };

      console.log("Making API call to /api/orders/admin");
      const response = await axiosClient.get("/api/orders/admin", { params });
      console.log("API response:", response.data);
      
      if (response.data.success) {
        console.log("Setting orders:", response.data.orders);
        setOrders(response.data.orders);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
        }));
      } else {
        console.error("API returned success: false");
        message.error("Failed to fetch orders: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [pagination, searchText, statusFilter, dateRange]);

  const fetchStatistics = useCallback(async () => {
    console.log("fetchStatistics called");
    try {
      console.log("Making API call to /api/orders/admin/statistics");
      const response = await axiosClient.get("/api/orders/admin/statistics");
      console.log("Statistics API response:", response.data);
      
      if (response.data.success) {
        console.log("Setting statistics:", response.data.statistics);
        setStatistics(response.data.statistics);
      } else {
        console.error("Statistics API returned success: false");
        message.error("Failed to fetch statistics: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      console.error("Statistics error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    const initializeData = async () => {
      // Check authentication status
      const token = Cookies.get("access_token");
      console.log("Access token:", token ? `exists (${token.substring(0, 20)}...)` : "missing");
      
      if (!token) {
        message.error("No access token found. Please login again.");
        return;
      }
      
      console.log("Initializing admin order management...");
      
      // Test token and fetch data inline
      try {
        console.log("Testing token validity...");
        const testResponse = await axiosClient.get("/api/orders/admin/statistics");
        console.log("Token is valid, statistics response:", testResponse.data);
        
        if (testResponse.data.success) {
          setStatistics(testResponse.data.statistics);
        }
        
        // Now fetch orders
        console.log("Fetching orders...");
        const ordersResponse = await axiosClient.get("/api/orders/admin", {
          params: {
            page: 1,
            limit: 10
          }
        });
        console.log("Orders response:", ordersResponse.data);
        
        if (ordersResponse.data.success) {
          setOrders(ordersResponse.data.orders);
          setPagination(prev => ({
            ...prev,
            current: 1,
            total: ordersResponse.data.total,
          }));
        }
        
      } catch (error) {
        console.error("Initialization failed:", error);
        if (error.response?.status === 401) {
          message.error("Session expired. Please login again.");
        } else if (error.response?.status === 403) {
          message.error("You don't have admin privileges.");
        } else {
          message.error(`Failed to load data: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []); // Only run on mount

  // Effect for re-fetching when filters change
  useEffect(() => {
    if (pagination.current > 1 || searchText || statusFilter !== "all" || dateRange.length > 0) {
      fetchOrders();
    }
  }, [fetchOrders, pagination, searchText, statusFilter, dateRange]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axiosClient.put(`/api/orders/admin/${orderId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        message.success("Order status updated successfully");
        fetchOrders();
        fetchStatistics();
        setEditModalVisible(false);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      message.error("Failed to update order status");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    Modal.confirm({
      title: "Are you sure?",
      content: "This action cannot be undone. The order will be permanently deleted.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await axiosClient.delete(`/api/orders/admin/${orderId}`);
          if (response.data.success) {
            message.success("Order deleted successfully");
            fetchOrders();
            fetchStatistics();
          }
        } catch (error) {
          console.error("Error deleting order:", error);
          message.error("Failed to delete order");
        }
      },
    });
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (text) => (
        <Text code className="text-xs">
          {text.slice(-8).toUpperCase()}
        </Text>
      ),
      width: 100,
    },
    {
      title: "Customer",
      dataIndex: ["user", "username"],
      key: "customer",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-xs">{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items) => (
        <div className="text-center">
          <Text strong>{items?.length || 0}</Text>
          <div className="text-gray-500 text-xs">items</div>
        </div>
      ),
      width: 80,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <Text strong className="text-green-600">
          ${amount?.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusInfo = orderStatusMap[status] || { color: "default", text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      filters: Object.keys(orderStatusMap).map(key => ({
        text: orderStatusMap[key].text,
        value: key,
      })),
      width: 120,
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => (
        <Tag color={status === "paid" ? "green" : status === "pending" ? "orange" : "red"}>
          {status?.toUpperCase()}
        </Tag>
      ),
      width: 130,
    },
    {
      title: "Order Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <div>
          <div>{dayjs(date).format("MMM DD, YYYY")}</div>
          <div className="text-gray-500 text-xs">{dayjs(date).format("HH:mm")}</div>
        </div>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      width: 130,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Status">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setEditModalVisible(true);
              }}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: "delete",
                  label: "Delete Order",
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteOrder(record._id),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  const handleTableChange = (paginationInfo, filters, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    }));
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDateRange([]);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6">
        <div className="mb-6">
          <Title level={2} className="mb-0">
            Order Management
          </Title>
          <Text type="secondary">Manage and track all customer orders</Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Orders"
                value={statistics.totalOrders}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={statistics.totalRevenue}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Orders"
                value={statistics.pendingOrders}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed Orders"
                value={statistics.completedOrders}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search orders..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
                placeholder="Filter by status"
              >
                <Option value="all">All Status</Option>
                {Object.keys(orderStatusMap).map(key => (
                  <Option key={key} value={key}>
                    {orderStatusMap[key].text}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchOrders}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  onClick={() => message.info("Export feature coming soon")}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Orders Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} orders`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="small"
          />
        </Card>

        {/* Order Detail Modal */}
        <OrderDetailModal
          visible={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          order={selectedOrder}
          orderStatusMap={orderStatusMap}
        />

        {/* Edit Status Modal */}
        <Modal
          title="Update Order Status"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          {selectedOrder && (
            <div>
              <p className="mb-4">
                Update status for order: <Text code>{selectedOrder._id?.slice(-8).toUpperCase()}</Text>
              </p>
              <Select
                style={{ width: "100%" }}
                placeholder="Select new status"
                defaultValue={selectedOrder.status}
                onChange={(value) => handleUpdateOrderStatus(selectedOrder._id, value)}
              >
                {Object.keys(orderStatusMap).map(key => (
                  <Option key={key} value={key}>
                    <Tag color={orderStatusMap[key].color}>{orderStatusMap[key].text}</Tag>
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </Modal>
      </div>
    </motion.div>
  );
};

export default ManageOrder;
