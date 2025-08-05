"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  return (
    <div className="text-center py-10 text-red-500">
      Thanh toán đã bị huỷ.
      <br />
      {appointmentId && (
        <div className="mt-4">
          <a
            href={`/appointments/payment/${appointmentId}`}
            className="underline text-blue-600"
          >
            Thử thanh toán lại
          </a>
        </div>
      )}
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
