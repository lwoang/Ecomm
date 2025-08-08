// Import cac thu vien va model can thiet
import crypto from "crypto";
import dotenv from "dotenv";
import moment from "moment";
import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js";
import ProductVariation from "../models/productVariation.model.js";
import OrderDetail from "../models/orderDetail.model.js";
import mongoose from "mongoose";

dotenv.config();

// Ham tao URL thanh toan VNPay
export const generatePaymentUrl = async (req, res) => {
  // Dat mui gio Viet Nam
  process.env.TZ = "Asia/Ho_Chi_Minh";

  const { orderId } = req.body;

  // Kiem tra dinh dang order ID
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).json({ 
      success: false, 
      message: "Invalid order id" 
    });
  }

  // Tim order trong database
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(401).json({
      success: false,
      message: "OrderId not found",
    });
  }

  // Tao thoi gian tao va het han
  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");
  const expireDate = moment(date).add(15, "minutes").format("YYYYMMDDHHmmss");
  
  // Cac thong tin VNPay
  const ipAddr = "1.55.200.158";
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const frontendUrl = process.env.FRONTEND_URL;
  const returnUrl = `${frontendUrl}/payment-callback`;

  // Cac tham so VNPay
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Payment for ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: order.total_amount * 100 * 26000, // Chuyen doi tu USD sang VND
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  // Sap xep tham so va tao signature
  const sortedParams = sortParams(vnp_Params);
  const urlParams = new URLSearchParams();
  
  for (let [key, value] of Object.entries(sortedParams)) {
    urlParams.append(key, value);
  }

  const querystring = urlParams.toString();
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(querystring).digest("hex");
  urlParams.append("vnp_SecureHash", signed);

  const paymentUrl = `${vnpUrl}?${urlParams.toString()}`;

  res.json({
    success: true,
    paymentUrl: paymentUrl,
  });
};

// Ham sap xep tham so theo alphabet
function sortParams(obj) {
  return Object.entries(obj)
    .filter(([key, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

// Ham xu ly response tu VNPay (redirect)
export const handlePaymentResponse = async (req, res) => {
  const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo, vnp_Amount } = req.query;
  
  try {
    // Kiem tra cac truong bat buoc
    if (!vnp_ResponseCode || !vnp_TxnRef) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Kiem tra dinh dang ObjectId
    if (!mongoose.Types.ObjectId.isValid(vnp_TxnRef)) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/failed`);
    }

    // Tim order trong database
    const order = await Order.findById(vnp_TxnRef);
    if (!order) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/failed`);
    }

    // Kiem tra order da xu ly chua
    if (order.order_status === "completed") {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/success`);
    }
    
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    let status = "failed";
    
    // Xu ly thanh toan that bai
    if (vnp_ResponseCode !== "00") {
      const orderDetails = await OrderDetail.find({ order_id: order._id });
      if (orderDetails.length > 0) {
        await OrderDetail.deleteMany({ order_id: order._id });
      }
      await Order.findByIdAndDelete(order._id);
      return res.redirect(`${frontendUrl}/failed`);
    } 
    
    // Xu ly thanh toan thanh cong
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, order_status: { $ne: "completed" } },
      { order_status: "completed" },
      { new: true }
    );
    
    if (updatedOrder) {
      status = "completed";
      // Cap nhat so luong ton kho
      const orderDetails = await OrderDetail.find({ order_id: order._id });
      for (const detail of orderDetails) {
        await ProductVariation.findByIdAndUpdate(detail.variation_id, {
          $inc: { stock_quantity: -detail.quantity },
        });
      }
    } else {
      status = "completed"; // Da duoc xu ly boi process khac
    }

    // Tinh toan so tien va luu transaction
    const amountInVND = Number(vnp_Amount) || 0;
    const amountInUSD = amountInVND / 100 / 26000;

    await Transaction.findOneAndUpdate(
      { transaction_id: vnp_TransactionNo || "N/A" },
      {
        order_id: order._id,
        payment_method: "vnpay",
        amount: amountInUSD,
        transaction_id: vnp_TransactionNo || "N/A",
        status,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    res.redirect(`${frontendUrl}/success`);
  } catch (error) {
    // Xu ly loi va don dep
    if (req.query?.vnp_TxnRef && mongoose.Types.ObjectId.isValid(req.query.vnp_TxnRef)) {
      try {
        const existingOrder = await Order.findById(req.query.vnp_TxnRef);
        if (existingOrder) {
          await OrderDetail.deleteMany({ order_id: req.query.vnp_TxnRef });
          await Order.findByIdAndDelete(req.query.vnp_TxnRef);
        }
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
    }
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/failed`);
  }
};

// Ham xu ly callback tu frontend (API endpoint)
export const handlePaymentCallback = async (req, res) => {
  const { vnp_ResponseCode, vnp_TxnRef, vnp_TransactionNo, vnp_Amount } = req.body;
  
  try {
    // Kiem tra cac truong bat buoc
    if (!vnp_ResponseCode || !vnp_TxnRef) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Kiem tra dinh dang ObjectId
    if (!mongoose.Types.ObjectId.isValid(vnp_TxnRef)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Tim order trong database
    const order = await Order.findById(vnp_TxnRef);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "OrderId not found",
      });
    }

    // Kiem tra order da xu ly chua
    if (order.order_status === "completed") {
      return res.json({
        success: true,
        message: "Payment already processed",
        paymentStatus: "completed",
      });
    }
    
    let status = "failed";
    
    // Xu ly thanh toan that bai
    if (vnp_ResponseCode !== "00") {
      const orderDetails = await OrderDetail.find({ order_id: order._id });
      if (orderDetails.length > 0) {
        await OrderDetail.deleteMany({ order_id: order._id });
      }
      await Order.findByIdAndDelete(order._id);
    } else {
      // Xu ly thanh toan thanh cong
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id, order_status: { $ne: "completed" } },
        { order_status: "completed" },
        { new: true }
      );
      
      if (updatedOrder) {
        status = "completed";
        // Cap nhat so luong ton kho
        const orderDetails = await OrderDetail.find({ order_id: order._id });
        for (const detail of orderDetails) {
          await ProductVariation.findByIdAndUpdate(detail.variation_id, {
            $inc: { stock_quantity: -detail.quantity },
          });
        }
      } else {
        status = "completed"; // Da duoc xu ly boi process khac
      }
    }

    // Tinh toan so tien va luu transaction
    const amountInVND = Number(vnp_Amount) || 0;
    const amountInUSD = amountInVND / 100 / 26000;

    try {
      await Transaction.findOneAndUpdate(
        { transaction_id: vnp_TransactionNo || "N/A" },
        {
          order_id: order._id,
          payment_method: "vnpay",
          amount: amountInUSD,
          transaction_id: vnp_TransactionNo || "N/A",
          status,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (transactionError) {
      // Bỏ qua lỗi duplicate transaction
      if (transactionError.code !== 11000) {
        throw transactionError;
      }
    }

    res.json({
      success: true,
      message: "Payment processed successfully",
      paymentStatus: status,
    });
  } catch (error) {
    // Xu ly loi va don dep
    if (req.body?.vnp_TxnRef && mongoose.Types.ObjectId.isValid(req.body.vnp_TxnRef)) {
      try {
        const existingOrder = await Order.findById(req.body.vnp_TxnRef);
        if (existingOrder) {
          await OrderDetail.deleteMany({ order_id: req.body.vnp_TxnRef });
          await Order.findByIdAndDelete(req.body.vnp_TxnRef);
        }
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
