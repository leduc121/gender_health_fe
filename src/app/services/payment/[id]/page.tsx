"use client";

import { useToast } from "@/components/ui/use-toast";
import tokenMethod from "@/utils/token";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ServicePaymentPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? tokenMethod.get()?.accessToken : null;
    if (!id || !token) {
      setError("Thiếu thông tin dịch vụ hoặc chưa đăng nhập.");
      setLoading(false);
      return;
    }
    const createPayment = async () => {
      try {
        const res = await fetch(
          "https://genderhealthcare.uk/payments/services",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              serviceId: id,
              description: "Thanh toán dịch vụ đơn lẻ",
              frontendReturnUrl: `${window.location.origin}/services/payment/success`,
              frontendCancelUrl: `${window.location.origin}/services/payment/cancel?serviceId=${id}`,
            }),
          }
        );
        const data = await res.json();
        if (data?.data?.paymentUrl) {
          window.location.href = data.data.paymentUrl;
        } else if (data?.data?.approvalUrl) {
          window.location.href = data.data.approvalUrl;
        } else if (data?.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        } else {
          setError(data.message || "Không thể tạo thanh toán dịch vụ.");
        }
      } catch (e) {
        setError("Không thể tạo thanh toán dịch vụ.");
      } finally {
        setLoading(false);
      }
    };
    createPayment();
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-10">
        Đang chuyển hướng đến cổng thanh toán dịch vụ...
      </div>
    );
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;
  return null;
}
