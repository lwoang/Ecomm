import ProductVariation from "../models/productVariation.model.js";
import Order from "../models/order.model.js";
import OrderDetail from "../models/orderDetail.model.js";
import CartItem from "../models/cartItem.model.js";
import Product from "../models/product.model.js";
import ProductImage from "../models/productImage.model.js";
import Address from "../models/address.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
  const { id } = req.user;
  const { products } = req.body;

  if (!products) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const addresses = await Address.find({ user_id: id }).lean();
  const defaultAddress = addresses.find((addr) => addr.is_default);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalAmount = 0;
    for (const item of products) {
      const product = await ProductVariation.findById(item._id);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      const availableStock = product.stock_quantity;

      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }

      totalAmount += item.price * item.quantity;
    }

    const order = new Order({
      user_id: id,
      address_id: defaultAddress._id,
      total_amount: totalAmount,
    });

    const saveOrder = await order.save({ session });

    for (const item of products) {
      const orderDetail = new OrderDetail({
        order_id: saveOrder._id,
        product_id: item.product_id,
        variation_id: item._id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      });
      await orderDetail.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: saveOrder._id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const createOrderFromCart = async (req, res) => {
  const { id } = req.user;
  const { cartItemIds } = req.body;
  if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Selected cart items are required",
    });
  }

  const addresses = await Address.find({ user_id: id }).lean();
  const defaultAddress = addresses.find((addr) => addr.is_default);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cartItems = await CartItem.find({
      _id: { $in: cartItemIds },
    }).session(session);

    if (cartItems.length !== cartItemIds.length) {
      throw new Error("Some cart items not found");
    }

    let totalAmount = 0;
    const orderDetails = [];

    for (const item of cartItems) {
      const variation = await ProductVariation.findById(
        item.variation_id
      ).session(session);
      if (!variation) throw new Error("Product variation not found");

      if (variation.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for variation ${variation._id}`);
      }

      totalAmount += variation.price * item.quantity;

      orderDetails.push({
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.quantity,
        price_at_purchase: variation.price,
      });
    }

    const order = new Order({
      user_id: id,
      address_id: defaultAddress._id,
      total_amount: totalAmount,
    });
    const savedOrder = await order.save({ session });

    for (const detail of orderDetails) {
      await new OrderDetail({
        order_id: savedOrder._id,
        ...detail,
      }).save({ session });
    }

    await CartItem.deleteMany({ _id: { $in: cartItemIds } }).session(session);

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: "Order created and cart items removed",
      orderId: savedOrder._id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getOrdersByUser = async (req, res) => {
  const { id } = req.user;
  const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
  const skip = (page - 1) * limit;
  try {
    const totalOrders = await Order.countDocuments({ user_id: id });

    const orders = await Order.find({ user_id: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const details = await OrderDetail.find({ order_id: order._id })
          .populate({
            path: "product_id",
            model: Product,
            select: "name description price category_id seller_id",
          })
          .populate({
            path: "variation_id",
            model: ProductVariation,
            select: "size color price stock_quantity",
          })
          .lean();

        const detailsWithImages = await Promise.all(
          details.map(async (detail) => {
            const images = await ProductImage.find({
              productId: detail.product_id?._id || detail.product_id,
            })
              .sort({ isPrimary: -1, displayOrder: 1 })
              .select("imageUrl isPrimary displayOrder altText -_id")
              .lean();
            return {
              ...detail,
              images,
            };
          })
        );

        return {
          ...order,
          details: detailsWithImages,
        };
      })
    );

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      orders: ordersWithDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Admin functions
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Filter by status
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate + 'T23:59:59.999Z');
      }
    }

    // Search functionality
    let userFilter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      const users = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      
      if (users.length > 0) {
        userFilter.user_id = { $in: users.map(user => user._id) };
      } else {
        // If no users found, search in order IDs
        if (mongoose.Types.ObjectId.isValid(req.query.search)) {
          filter._id = req.query.search;
        }
      }
    }

    const finalFilter = { ...filter, ...userFilter };
    
    const totalOrders = await Order.countDocuments(finalFilter);
    
    const orders = await Order.find(finalFilter)
      .populate({
        path: 'user_id',
        model: User,
        select: 'username email'
      })
      .populate({
        path: 'address_id',
        model: Address,
        select: 'street city state zipCode phone'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get order details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const details = await OrderDetail.find({ order_id: order._id })
          .populate({
            path: "product_id",
            model: Product,
            select: "name description price"
          })
          .populate({
            path: "variation_id",
            model: ProductVariation,
            select: "size color price"
          })
          .lean();

        return {
          _id: order._id,
          user: order.user_id,
          shippingAddress: order.address_id,
          totalAmount: order.total_amount,
          status: order.status || 'pending',
          paymentStatus: order.payment_status || 'pending',
          items: details,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      orders: ordersWithDetails,
      total: totalOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit)
    });
  } catch (error) {
    console.error('Error in getAllOrdersAdmin:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

export const getOrderStatisticsAdmin = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const revenueResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total_amount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    
    const pendingOrders = await Order.countDocuments({ 
      status: { $in: ['pending', 'confirmed', 'processing'] }
    });
    
    const completedOrders = await Order.countDocuments({ 
      status: 'delivered' 
    });

    return res.status(200).json({
      success: true,
      statistics: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders
      }
    });
  } catch (error) {
    console.error('Error in getOrderStatisticsAdmin:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in updateOrderStatusAdmin:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

export const deleteOrderAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId } = req.params;
    
    // Delete order details first
    await OrderDetail.deleteMany({ order_id: orderId }).session(session);
    
    // Delete the order
    const deletedOrder = await Order.findByIdAndDelete(orderId).session(session);
    
    if (!deletedOrder) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in deleteOrderAdmin:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
