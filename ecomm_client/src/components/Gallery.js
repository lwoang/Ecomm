import { useState, useEffect } from "react";
import categoryApi from "../api/categoryApi";
import productApi from "../api/productApi";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

const Gallery = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const categoriesResponse = await categoryApi.getAll();
        console.log("Categories response:", categoriesResponse); // Debug log
        
        // Ensure categories is always an array
        let categoriesData = [];
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        } else if (Array.isArray(categoriesResponse)) {
          categoriesData = categoriesResponse;
        } else if (categoriesResponse && typeof categoriesResponse === 'object') {
          // If it's an object, try to extract array from common property names
          categoriesData = categoriesResponse.categories || categoriesResponse.data || [];
        }
        
        setCategories(categoriesData);
        
        // Fetch products - limit to 12 products
        const productsResponse = await productApi.getAllProducts(1, 12, "latest");
        console.log("Products response:", productsResponse); // Debug log
        setProducts(productsResponse.data || productsResponse.products || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setCategories([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCategoryClick = async (categoryName) => {
    try {
      setLoading(true);
      setSelectedCategory(categoryName);
      
      if (categoryName === "all") {
        const productsResponse = await productApi.getAllProducts(1, 12, "latest");
        console.log("Filtered products response:", productsResponse); // Debug log
        setProducts(productsResponse.data || productsResponse.products || []);
      } else {
        const productsResponse = await productApi.searchProducts({
          keyword: categoryName,
          page: 1,
          limit: 12,
          sortBy: "latest"
        });
        console.log("Search products response:", productsResponse); // Debug log
        setProducts(productsResponse.data || productsResponse.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch filtered products:", err);
    } finally {
      setLoading(false);
    }
  };

  const images = [
    "https://images.pexels.com/photos/4456815/pexels-photo-4456815.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/19852011/pexels-photo-19852011/free-photo-of-thanh-ph-th-i-trang-ng-i-kinh-ram.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/20025540/pexels-photo-20025540/free-photo-of-anh-sang-th-i-trang-dan-ba-sang-t-o.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/914668/pexels-photo-914668.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/15336571/pexels-photo-15336571/free-photo-of-th-i-trang-giay-cao-d-ng.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/13963459/pexels-photo-13963459.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/11334890/pexels-photo-11334890.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/20147045/pexels-photo-20147045/free-photo-of-dan-ba-mo-hinh-qu-n-jean-d-ng.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/13741783/pexels-photo-13741783.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/4132651/pexels-photo-4132651.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load",
    "https://images.pexels.com/photos/157675/fashion-men-s-individuality-black-and-white-157675.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600",
  ];

  // Float + slow rotate + pulse + bounce keyframes injected once
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      @keyframes slow-rotate {
        0% { transform: rotateY(0deg); }
        50% { transform: rotateY(10deg); }
        100% { transform: rotateY(0deg); }
      }
      @keyframes bounce-scale {
        0%, 100% { transform: scale(1) rotateX(0deg) rotateY(0deg); }
        50% { transform: scale(1.15) rotateX(15deg) rotateY(15deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.9); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          // Loading state - 12 items to match product limit
          Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="relative rounded-lg bg-gray-200 animate-pulse"
              style={{ aspectRatio: "1/1" }}
            >
              <div className="w-full h-full rounded-lg bg-gray-300"></div>
            </div>
          ))
        ) : products && products.length > 0 ? (
          // Display products - limit to 12 products maximum
          products.slice(0, 12).map((product, index) => (
            <div
              key={product._id || index}
              className="relative rounded-lg cursor-pointer"
              style={{ perspective: "1200px" }}
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <img
                src={
                  // Ưu tiên ảnh primary, nếu không có thì lấy ảnh đầu tiên, cuối cùng mới dùng ảnh mặc định
                  product.images?.find(img => img.isPrimary)?.imageUrl ||
                  product.images?.[0]?.imageUrl ||
                  product.imageUrl ||
                  images[index % images.length]
                }
                alt={product.name || `Product ${index + 1}`}
                loading="lazy"
                draggable={false}
                className="w-full h-auto rounded-lg border border-gray-200 shadow-lg object-cover"
                style={{
                  animation:
                    "float 5s ease-in-out infinite, slow-rotate 10s ease-in-out infinite",
                  transformStyle: "preserve-3d",
                  transition:
                    "transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.12)",
                  filter: "brightness(1)",
                  aspectRatio: "1/1",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation =
                    "bounce-scale 0.6s ease forwards";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px 4px rgba(59, 130, 246, 0.8), 0 0 40px 10px rgba(59, 130, 246, 0.6)";
                  e.currentTarget.style.filter = "brightness(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation =
                    "float 5s ease-in-out infinite, slow-rotate 10s ease-in-out infinite";
                  e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.12)";
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg">
                <h3 className="text-white font-semibold text-sm truncate">
                  {product.name}
                </h3>
                <p className="text-white/80 text-xs">
                  ${product.price?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
          ))
        ) : (
          // No products found
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
