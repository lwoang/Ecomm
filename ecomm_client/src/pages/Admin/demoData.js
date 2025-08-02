// Demo data for testing ManageCategory component
export const demoCategories = [
  {
    _id: "1",
    name: "Electronics",
    parent_id: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "2", 
    name: "Clothing",
    parent_id: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "3",
    name: "Smartphones",
    parent_id: {
      _id: "1",
      name: "Electronics"
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "4",
    name: "Laptops", 
    parent_id: {
      _id: "1",
      name: "Electronics"
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "5",
    name: "Men's Clothing",
    parent_id: {
      _id: "2", 
      name: "Clothing"
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "6",
    name: "Women's Clothing",
    parent_id: {
      _id: "2",
      name: "Clothing" 
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
];

// Usage: Import and use in ManageCategory component for testing
// import { demoCategories } from './demoData';
// setCategories(demoCategories); // For testing without API
