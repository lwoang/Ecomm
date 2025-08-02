import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Card,
  Typography,
  Space,
  Input,
  Select,
  Tag,
  Image,
  Modal,
  Descriptions,
  Empty,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import productApi from "../../api/productApi";
import categoryApi from "../../api/categoryApi";
import ProductStats from "../../components/Admin/ProductStats";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const ProductList = ({ onCreateNew, onEdit }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products
  const fetchProducts = async (
    page = 1,
    keyword = searchKeyword,
    categoryFilter = selectedCategory,
    sortFilter = sortBy
  ) => {
    setLoading(true);
    try {
      const response = await productApi.searchProducts({
        keyword: keyword || "", // Allow empty keyword to fetch all products
        sortBy: sortFilter,
        page,
        limit: pagination.pageSize,
      });

      if (response && response.data) {
        let filteredData = response.data;
        
        // Filter by category if selected
        if (categoryFilter) {
          filteredData = response.data.filter(
            (product) => product.category_id === categoryFilter
          );
        }

        setProducts(filteredData);
        setPagination({
          ...pagination,
          current: page,
          total: response.pagination?.totalProducts || filteredData.length,
        });
      } else {
        // If no response data, set empty array
        setProducts([]);
        setPagination({
          ...pagination,
          current: page,
          total: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      console.log("Categories response:", response); // Debug log
      
      // Ensure categories is always an array
      let categoriesData = [];
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response && typeof response === 'object') {
        // If it's an object, try to extract array from common property names
        categoriesData = response.categories || response.data || [];
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]); // Set empty array on error
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
      // Load all products initially
      await fetchProducts(1, "", null, "latest");
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchKeyword("");
    setSelectedCategory(null);
    setSortBy("latest");
    fetchProducts(1, "", null, "latest");
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchKeyword(value);
    fetchProducts(1, value, selectedCategory, sortBy);
  };

  // Handle category filter
  const handleCategoryFilter = (value) => {
    setSelectedCategory(value);
    fetchProducts(1, searchKeyword, value, sortBy);
  };

  // Handle sort
  const handleSort = (value) => {
    setSortBy(value);
    fetchProducts(1, searchKeyword, selectedCategory, value);
  };

  // Handle pagination
  const handleTableChange = (paginationConfig) => {
    setPagination(paginationConfig);
    fetchProducts(paginationConfig.current);
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    try {
      await productApi.deleteProduct(productId);
      message.success("Product deleted successfully");
      // Refresh with current filters
      fetchProducts(pagination.current, searchKeyword || "", selectedCategory, sortBy);
    } catch (error) {
      message.error("Failed to delete product");
      console.error("Error deleting product:", error);
    }
  };

  // Handle view product details
  const handleView = (product) => {
    setSelectedProduct(product);
    setViewModalVisible(true);
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!Array.isArray(categories) || categories.length === 0 || !categoryId) {
      return "Unknown";
    }
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Table columns
  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "image",
      width: 80,
      render: (images) => (
        <Image
          src={images?.[0]?.imageUrl || "/placeholder-image.jpg"}
          alt="Product"
          width={50}
          height={50}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          fallback="/placeholder-image.jpg"
        />
      ),
    },
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category_id",
      key: "category",
      render: (categoryId) => (
        <Tag color="blue">{getCategoryName(categoryId)}</Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span className="font-semibold text-green-600">{formatPrice(price)}</span>
      ),
      sorter: true,
    },
    {
      title: "Variations",
      dataIndex: "variations",
      key: "variations",
      render: (variations) => (
        <Tag color="purple">{variations?.length || 0} variants</Tag>
      ),
    },
    {
      title: "Stock Status",
      key: "stock",
      render: (_, record) => {
        const totalStock = record.variations?.reduce(
          (sum, variation) => sum + (variation.stock_quantity || 0),
          0
        );
        
        if (totalStock === 0) {
          return <Tag color="red">Out of Stock</Tag>;
        } else if (totalStock < 10) {
          return <Tag color="orange">Low Stock ({totalStock})</Tag>;
        } else {
          return <Tag color="green">In Stock ({totalStock})</Tag>;
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Product">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit && onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Product">
            <Popconfirm
              title="Delete Product"
              description="Are you sure you want to delete this product?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
              okType="danger"
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                type="primary"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Statistics */}
      <ProductStats />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          title={
            <div className="flex items-center gap-3">
              <ShoppingOutlined className="text-2xl text-blue-600" />
              <Title level={3} className="m-0">
                Product Management
              </Title>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreateNew}
              size="large"
              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
            >
              Add Product
            </Button>
          }
          className="shadow-lg mb-6"
        >
          {/* Filters */}
          <div className="mb-4">
            <Space
              direction="vertical"
              size="middle"
              className="w-full"
              wrap
            >
              <div className="flex flex-wrap gap-4 items-center">
                <Search
                  placeholder="Search products..."
                  onSearch={handleSearch}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  value={searchKeyword}
                  style={{ width: 300 }}
                  enterButton={<SearchOutlined />}
                  allowClear
                />
                
                <Select
                  placeholder="Filter by category"
                  style={{ width: 200 }}
                  allowClear
                  value={selectedCategory}
                  onChange={handleCategoryFilter}
                >
                  {Array.isArray(categories) && categories.length > 0 && categories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>

                <Select
                  placeholder="Sort by"
                  style={{ width: 150 }}
                  value={sortBy}
                  onChange={handleSort}
                >
                  <Option value="latest">Latest</Option>
                  <Option value="price_asc">Price: Low to High</Option>
                  <Option value="price_des">Price: High to Low</Option>
                  <Option value="name">Name A-Z</Option>
                </Select>

                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchProducts(1, searchKeyword || "", selectedCategory, sortBy)}
                  loading={loading}
                >
                  Refresh
                </Button>

                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  type="default"
                >
                  Clear All
                </Button>
              </div>
            </Space>
          </div>

          {/* Products Table */}
          <Table
            columns={columns}
            dataSource={products}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} products`,
            }}
            onChange={handleTableChange}
            className="mt-4"
            scroll={{ x: 1200 }}
            bordered
            size="middle"
          />
        </Card>
      </motion.div>

      {/* Product Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined />
            <span>Product Details</span>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setViewModalVisible(false);
              onEdit && onEdit(selectedProduct);
            }}
          >
            Edit Product
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedProduct && (
          <div className="space-y-6">
            {/* Product Basic Info */}
            <Descriptions
              title="Basic Information"
              bordered
              column={2}
              size="small"
            >
              <Descriptions.Item label="Name" span={2}>
                {selectedProduct.name}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedProduct.description}
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                {formatPrice(selectedProduct.price)}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color="blue">
                  {getCategoryName(selectedProduct.category_id)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Product Images */}
            <div>
              <Title level={5}>Product Images</Title>
              {selectedProduct.images?.length > 0 ? (
                <Image.PreviewGroup>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProduct.images.map((image, index) => (
                      <Image
                        key={index}
                        src={image.imageUrl}
                        alt={`Product ${index + 1}`}
                        width={100}
                        height={100}
                        style={{ objectFit: "cover", borderRadius: "4px" }}
                        fallback="/placeholder-image.jpg"
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              ) : (
                <Empty description="No images available" />
              )}
            </div>

            {/* Product Variations */}
            <div>
              <Title level={5}>Variations ({selectedProduct.variations?.length || 0})</Title>
              {selectedProduct.variations?.length > 0 ? (
                <div className="space-y-3">
                  {selectedProduct.variations.map((variation, index) => (
                    <Card key={index} size="small" className="bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <div>
                            <span className="font-medium">Size:</span>{" "}
                            <Tag>{variation.size}</Tag>
                          </div>
                          <div>
                            <span className="font-medium">Color:</span>{" "}
                            <Tag color="blue">{variation.color}</Tag>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="font-medium">Price:</span>{" "}
                            <span className="text-green-600 font-semibold">
                              {formatPrice(variation.price)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Stock:</span>{" "}
                            <Tag
                              color={
                                variation.stock_quantity === 0
                                  ? "red"
                                  : variation.stock_quantity < 10
                                  ? "orange"
                                  : "green"
                              }
                            >
                              {variation.stock_quantity}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description="No variations available" />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;
