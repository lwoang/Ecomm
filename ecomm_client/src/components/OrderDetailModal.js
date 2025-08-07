import React from "react";
import { Modal, Descriptions, Tag, Table, Typography, Image } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const OrderDetailModal = ({ 
  visible, 
  onCancel, 
  order, 
  orderStatusMap 
}) => {
  if (!order) return null;

  const itemColumns = [
    {
      title: "Product",
      dataIndex: ["product_id", "name"],
      key: "product",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          {record.images && record.images.length > 0 && (
            <Image
              src={record.images[0].imageUrl}
              alt={record.product_id?.name}
              width={50}
              height={50}
              className="rounded object-cover"
              preview={false}
            />
          )}
          <div>
            <div className="font-medium">{record.product_id?.name}</div>
            {record.variation_id && (
              <div className="text-gray-500 text-xs">
                Size: {record.variation_id.size} | Color: {record.variation_id.color}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Unit Price",
      dataIndex: "price_at_purchase",
      key: "price",
      width: 120,
      render: (price) => `$${price?.toFixed(2)}`,
      align: "right",
    },
    {
      title: "Total",
      key: "total",
      width: 120,
      render: (_, record) => (
        <Text strong>
          ${(record.quantity * record.price_at_purchase).toFixed(2)}
        </Text>
      ),
      align: "right",
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span>Order Details</span>
          <Text code className="ml-2">
            #{order._id?.slice(-8).toUpperCase()}
          </Text>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      className="order-detail-modal"
    >
      <div className="space-y-6">
        {/* Order Information */}
        <div>
          <Title level={5} className="mb-3">
            Order Information
          </Title>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Order ID" span={2}>
              <Text code>{order._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={orderStatusMap[order.status]?.color || "default"}>
                {orderStatusMap[order.status]?.text || order.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag 
                color={
                  order.paymentStatus === "paid" 
                    ? "green" 
                    : order.paymentStatus === "pending" 
                    ? "orange" 
                    : "red"
                }
              >
                {order.paymentStatus?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Order Date">
              {dayjs(order.createdAt).format("MMMM DD, YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {dayjs(order.updatedAt).format("MMMM DD, YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount" span={2}>
              <Text strong className="text-green-600 text-lg">
                ${order.totalAmount?.toFixed(2)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Customer Information */}
        <div>
          <Title level={5} className="mb-3">
            Customer Information
          </Title>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Name">
              {order.user?.username || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {order.user?.email || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {order.shippingAddress?.phone || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={1}>
              {order.shippingAddress ? (
                <div>
                  <div>{order.shippingAddress.street}</div>
                  <div>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.zipCode}
                  </div>
                </div>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Order Items */}
        <div>
          <Title level={5} className="mb-3">
            Order Items ({order.items?.length || 0} items)
          </Title>
          <Table
            dataSource={order.items || []}
            columns={itemColumns}
            pagination={false}
            size="small"
            rowKey={(item, index) => `${item.product_id?._id}-${index}`}
            className="border border-gray-200 rounded"
            summary={(pageData) => {
              const total = pageData.reduce(
                (sum, item) => sum + item.quantity * item.price_at_purchase,
                0
              );
              return (
                <Table.Summary.Row className="bg-gray-50">
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong className="text-green-600">
                      ${total.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
