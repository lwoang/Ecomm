import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import orderApi from "../../api/orderApi";

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
        const vnp_TxnRef = searchParams.get("vnp_TxnRef");
        const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
        const vnp_Amount = searchParams.get("vnp_Amount");
        const vnp_BankCode = searchParams.get("vnp_BankCode");
        const vnp_PayDate = searchParams.get("vnp_PayDate");
        const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
        const vnp_CardType = searchParams.get("vnp_CardType");
        const vnp_TransactionStatus = searchParams.get("vnp_TransactionStatus");
        const vnp_SecureHash = searchParams.get("vnp_SecureHash");

        // Send callback data to backend for processing
        const callbackData = {
          vnp_ResponseCode,
          vnp_TxnRef,
          vnp_TransactionNo,
          vnp_Amount,
          vnp_BankCode,
          vnp_PayDate,
          vnp_OrderInfo,
          vnp_CardType,
          vnp_TransactionStatus,
          vnp_SecureHash,
        };

        // Call backend API to handle payment response
        const response = await orderApi.handlePaymentCallback(callbackData);

        if (response.success) {
          if (vnp_ResponseCode === "00") {
            navigate("/success");
          } else {
            navigate("/failed");
          }
        } else {
          navigate("/failed");
        }
      } catch (error) {
        console.error("Payment callback error:", error);
        navigate("/failed");
      }
    };

    if (searchParams.has("vnp_ResponseCode")) {
      handlePaymentCallback();
    } else {
      navigate("/");
    }
  }, [searchParams, navigate]);

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen px-4">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-2xl max-w-lg w-full text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-blue-100 mb-6">
          <Spin size="large" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
          Processing Payment
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Please wait while we process your payment...
        </p>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
