import express from "express";
import {
  generatePaymentUrl,
  handlePaymentResponse,
  handlePaymentCallback,
} from "../controllers/vnpay.controller.js";

const router = express.Router();

router.post("/generate-payment-url", generatePaymentUrl);

router.get("/handle-payment-response", handlePaymentResponse);

router.post("/handle-payment-response", handlePaymentCallback);

export default router;
