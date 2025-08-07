import express from "express";
import {
  createOrder,
  createOrderFromCart,
  getOrdersByUser,
  getAllOrdersAdmin,
  getOrderStatisticsAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin,
} from "../controllers/order.controller.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);

router.post("/from-cart", verifyToken, createOrderFromCart);

router.get("/", verifyToken, getOrdersByUser);

// Admin routes
router.get("/admin", verifyToken, requireAdmin, getAllOrdersAdmin);
router.get("/admin/statistics", verifyToken, requireAdmin, getOrderStatisticsAdmin);
router.put("/admin/:orderId/status", verifyToken, requireAdmin, updateOrderStatusAdmin);
router.delete("/admin/:orderId", verifyToken, requireAdmin, deleteOrderAdmin);

export default router;
