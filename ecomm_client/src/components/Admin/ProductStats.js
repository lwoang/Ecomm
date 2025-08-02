// Dashboard Statistics for Products
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic } from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import productApi from "../../api/productApi";

const ProductStats = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    outOfStock: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch all products to calculate stats - empty keyword to get all
        const response = await productApi.searchProducts({
          keyword: "", // Empty keyword to fetch all products
          limit: 1000, // Get all products
        });

        if (response && response.data) {
          const products = response.data;
          const totalProducts = products.length;
          
          let totalValue = 0;
          let outOfStock = 0;
          let lowStock = 0;

          products.forEach((product) => {
            totalValue += product.price || 0;
            
            const totalStock = product.variations?.reduce(
              (sum, variation) => sum + (variation.stock_quantity || 0),
              0
            );

            if (totalStock === 0) {
              outOfStock++;
            } else if (totalStock < 10) {
              lowStock++;
            }
          });

          setStats({
            totalProducts,
            totalValue,
            outOfStock,
            lowStock,
          });
        }
      } catch (error) {
        console.error("Error fetching product stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Row gutter={16} className="mb-6">
      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title="Total Products"
            value={stats.totalProducts}
            prefix={<ShoppingOutlined />}
            loading={loading}
          />
        </Card>
      </Col>
      
      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title="Total Value"
            value={stats.totalValue}
            prefix={<DollarOutlined />}
            precision={2}
            loading={loading}
          />
        </Card>
      </Col>
      
      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title="Out of Stock"
            value={stats.outOfStock}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#cf1322' }}
            loading={loading}
          />
        </Card>
      </Col>
      
      <Col xs={12} sm={6}>
        <Card>
          <Statistic
            title="Low Stock"
            value={stats.lowStock}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProductStats;
