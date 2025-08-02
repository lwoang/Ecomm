import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import categoryApi from "../api/categoryApi";

const CategorySection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Default images for categories
  const categoryImages = {
    'Women': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'Men': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'Shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'Accessories': 'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6edb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'Bags': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'Jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'default': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Clear any cache first
        localStorage.removeItem('categoriesCache');
        const response = await categoryApi.getAll();
        console.log("Categories API response:", response); // Debug log
        
        // Extract data properly 
        let allCategories = [];
        if (response && response.data && Array.isArray(response.data)) {
          allCategories = response.data;
        } else if (Array.isArray(response)) {
          allCategories = response;
        }
        
        console.log("All categories:", allCategories); // Debug log
        // Filter only main categories (parent categories)
        const mainCategories = allCategories.filter(cat => !cat.parent_id) || [];
        console.log("Main categories:", mainCategories); // Debug log
        setCategories(mainCategories.slice(0, 6)); // Limit to 6 categories
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/search?keyword=${encodeURIComponent(categoryName)}`);
  };

  const getCategoryImage = (categoryName) => {
    return categoryImages[categoryName] || categoryImages.default;
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                <div className="bg-gray-200 h-4 rounded mx-auto w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Category</h2>
          <p className="text-gray-600">Discover our latest collections</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group cursor-pointer transform transition-transform duration-300 hover:scale-105"
              onClick={() => handleCategoryClick(category.name)}
            >
              <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={getCategoryImage(category.name)}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = categoryImages.default;
                    }}
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white text-lg font-bold text-center px-4">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySection;
