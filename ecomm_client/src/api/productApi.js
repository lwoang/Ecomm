import axiosClient from "./axiosClient.js";
import { LRUCache } from "lru-cache";

const cache = new LRUCache({
  max: 100,
  ttl: 5 * 60 * 1000,
  ttlAutopurge: true,
});

const loadCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem("product_search_cache");
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        cache.set(key, value);
      });
    }
  } catch (error) {
    console.warn("Failed to load cache from localStorage:", error.message);
  }
};

const saveCacheToStorage = () => {
  try {
    const cacheData = {};
    cache.forEach((value, key) => {
      cacheData[key] = value;
    });
    localStorage.setItem("product_search_cache", JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to save cache to localStorage:", error.message);
  }
};

loadCacheFromStorage();

const searchProducts = async ({
  keyword = "", // Default to empty string
  minPrice = null, // No minimum price filter
  maxPrice = null, // No maximum price filter
  sortBy = "createdAt:desc", // Default sort by newest
  page = 1, // Default to first page
  limit = 10,
}) => {
  // Allow empty keyword to fetch all products
  const cacheKey = `product_search_${keyword?.trim().toLowerCase() || "all"}_${
    minPrice || ""
  }_${maxPrice || ""}_${sortBy || ""}_${page || ""}_${limit || ""}`;

  // Check if the result is in cache
  if (cache.has(cacheKey)) {
    console.log(`Cache hit for query: ${cacheKey}`);
    return cache.get(cacheKey);
  }

  try {
    // Build query string
    const queryParams = new URLSearchParams();
    if (keyword) queryParams.append("keyword", keyword);
    if (minPrice) queryParams.append("minPrice", minPrice);
    if (maxPrice) queryParams.append("maxPrice", maxPrice);
    if (sortBy) queryParams.append("sortBy", sortBy);
    if (page) queryParams.append("page", page);
    if (limit) queryParams.append("limit", limit);

    const response = await axiosClient.get(
      `/api/products/search?${queryParams.toString()}`
    );
    const data = response.data;

    // Store in cache
    cache.set(cacheKey, data);
    // Save updated cache to localStorage
    saveCacheToStorage();

    return data;
  } catch (error) {
    console.error("Error searching products:", error.message);
    throw error;
  }
};

const getAllProducts = async (page = 1, limit = 10, sortBy = "latest") => {
  try {
    // Use empty keyword to get all products
    return await searchProducts({
      keyword: "",
      sortBy,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching all products:", error.message);
    throw error;
  }
};

const clearCache = () => {
  cache.clear();
  localStorage.removeItem("product_search_cache");
};

const addProduct = async (data) => {
  try {
    const response = await axiosClient.post("/api/products", data);
    // Clear cache after adding product
    clearCache();
    return response.data;
  } catch (error) {
    console.error("Error adding product:", error.message);
    throw error;
  }
};

const getProducts = async (page = 1, limit = 12) => {
  try {
    const response = await axiosClient.get(
      `/api/products?page=${page}&limit=${limit}`
    );
    const { data, pagination } = response.data;
    return { products: data, pagination };
  } catch (error) {
    console.error("Error fetching products:", error.message);
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    const response = await axiosClient.post(`/api/products/id`, { id });
    return response.data;
  } catch (error) {
    console.error("Error fetching the product:", error.message);
    throw error;
  }
};

const updateProduct = async (id, data) => {
  try {
    const response = await axiosClient.put(`/api/products/${id}`, data);
    // Clear cache after updating product
    clearCache();
    return response.data;
  } catch (error) {
    console.error("Error updating product:", error.message);
    throw error;
  }
};

const deleteProduct = async (id) => {
  try {
    const response = await axiosClient.delete(`/api/products/${id}`);
    // Clear cache after deleting product
    clearCache();
    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error.message);
    throw error;
  }
};

const productApi = { 
  getProducts, 
  getProductById, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  searchProducts,
  getAllProducts,
  clearCache
};
export default productApi;
