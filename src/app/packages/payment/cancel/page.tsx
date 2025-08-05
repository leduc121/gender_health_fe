"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PackagePaymentCancelContent() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId");
  const router = useRouter();

  const handleRetryPayment = () => {
    if (packageId) {
      router.push(`/packages/payment/${packageId}`);
    } else {
      router.push("/"); // Fallback to home or a generic packages page
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 text-red-500">
      <h1 className="text-2xl font-bold mb-4">
        Thanh toán gói dịch vụ đã bị huỷ.
      </h1>
      <p className="text-lg mb-6">Vui lòng thử lại nếu có lỗi xảy ra.</p>
      {packageId && (
        <Button onClick={handleRetryPayment}>
          Thử thanh toán lại gói dịch vụ
        </Button>
      )}
    </div>
  );
}

export default function PackagePaymentCancelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PackagePaymentCancelContent />
    </Suspense>
  );
}
