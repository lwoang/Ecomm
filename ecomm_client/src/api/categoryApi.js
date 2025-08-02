import axiosClient from "./axiosClient";
import { LRUCache } from "lru-cache";

const cache = new LRUCache({
  max: 100,
  ttl: 5 * 60 * 1000,
  ttlAutopurge: true,
});

const LOCAL_STORAGE_KEY = "categoriesCache";

function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      cache.set("all", parsed, { ttl: 5 * 60 * 1000 });
      return parsed;
    }
  } catch (e) {}
  return null;
}

function saveToLocalStorage(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

const categoryApi = {
  getAll: async () => {
    let cached = cache.get("all");
    if (!cached) {
      cached = loadFromLocalStorage();
    }
    if (cached) {
      return Promise.resolve(cached);
    }
    const response = await axiosClient.get("/api/categories");
    // Return the data directly instead of full response
    const data = response.data;
    cache.set("all", data, { ttl: 5 * 60 * 1000 });
    saveToLocalStorage(data);
    return data;
  },
  
  getById: async (id) => {
    const cached = cache.get(`category_${id}`);
    if (cached) {
      return Promise.resolve(cached);
    }
    const response = await axiosClient.get(`/api/categories/${id}`);
    cache.set(`category_${id}`, response, { ttl: 5 * 60 * 1000 });
    return response;
  },
  
  create: async (categoryData) => {
    const response = await axiosClient.post("/api/categories", categoryData);
    // Clear cache when creating new category
    cache.delete("all");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return response;
  },
  
  update: async (id, categoryData) => {
    const response = await axiosClient.put(`/api/categories/${id}`, categoryData);
    // Clear cache when updating category
    cache.delete("all");
    cache.delete(`category_${id}`);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return response;
  },
  
  delete: async (id) => {
    const response = await axiosClient.delete(`/api/categories/${id}`);
    // Clear cache when deleting category
    cache.delete("all");
    cache.delete(`category_${id}`);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return response;
  },
};

export default categoryApi;
