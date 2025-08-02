import Category from "../models/category.model.js";

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    const newCategory = new Category({ name, parent_id });
    await newCategory.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Category created successfully",
        data: newCategory,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error creating category", error: error.message });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parent_id", "name");
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching categories", error: error.message });
  }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate("parent_id", "name");

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching category", error: error.message });
  }
};

// Update a category by ID
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, parent_id },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating category", error: error.message });
  }
};

// Delete a category by ID
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting category", error: error.message });
  }
};
