"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import StiStepper from "@/components/StiStepper";
import StiServiceCard from "@/components/StiServiceCard";
import StiSummarySidebar from "@/components/StiSummarySidebar";
import { APIService, Service } from "@/services/service.service"; // Import APIService and Service
import { STITestingService, STITestData, StiTestProcess } from "@/services/sti-testing.service"; // Import STITestingService

const steps = [
  "Chọn dịch vụ",
  "Xác nhận thông tin",
  "Chọn ngày & giờ",
  "Xác nhận & đặt lịch",
  "Hoàn tất",
];

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((label, idx) => (
        <div key={label} className="flex-1 flex flex-col items-center relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg transition-all duration-300
              ${idx < step ? "bg-green-500" : idx === step ? "bg-primary scale-110" : "bg-gray-300"}
            `}
          >
            {idx < step ? <CheckCircle2 className="w-7 h-7" /> : idx + 1}
          </div>
          <span
            className={`mt-3 text-base font-semibold ${idx === step ? "text-primary" : idx < step ? "text-green-600" : "text-gray-400"}`}
          >
            {label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className="absolute top-6 right-0 left-1/2 h-1 w-full bg-gray-200 z-0"
              style={{ zIndex: -1 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SummarySidebar({
  selectedServices,
  user,
  selectedDate,
  selectedTime,
  step,
  estimatedCost,
  estimatedDuration,
}: any) {
  return (
    <aside className="sticky top-8 bg-white rounded-2xl shadow-2xl p-8 w-full md:w-96 mb-8 md:mb-0 border border-gray-100">
      <h3 className="font-bold text-xl mb-6 text-primary">Tóm tắt</h3>
      <div className="mb-4">
        <div className="font-medium text-gray-700">Dịch vụ đã chọn:</div>
        {selectedServices.length === 0 ? (
          <div className="text-gray-300 italic">Chưa chọn</div>
        ) : (
          <ul className="list-disc ml-5 mt-1 space-y-1">
            {selectedServices.map((s: any) => (
              <li
                key={s.id}
                className="flex justify-between items-center text-base"
              >
                <span>{s.name}</span>
                <span className="text-sm text-gray-500">
                  {s.price?.toLocaleString()}đ
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-3">
        <div className="font-medium text-gray-700">Ngày xét nghiệm:</div>
        <div className="text-base">
          {selectedDate ? (
            selectedDate.toLocaleDateString()
          ) : (
            <span className="text-gray-300 italic">Chưa chọn</span>
          )}
        </div>
      </div>
      <div className="mb-3">
        <div className="font-medium text-gray-700">Giờ xét nghiệm:</div>
        <div className="text-base">
          {selectedTime || (
            <span className="text-gray-300 italic">Chưa chọn</span>
          )}
        </div>
      </div>
      <div className="mb-3">
        <div className="font-medium text-gray-700">Khách hàng:</div>
        <div className="text-base">
          {user?.fullName || user?.email || (
            <span className="text-gray-300 italic">Chưa đăng nhập</span>
          )}
        </div>
      </div>
      {estimatedCost && (
        <div className="mb-3">
          <div className="font-medium text-gray-700">Tổng chi phí dự kiến:</div>
          <div className="text-primary font-bold text-lg">
            {estimatedCost.toLocaleString()}đ
          </div>
        </div>
      )}
      {estimatedDuration && (
        <div className="mb-3">
          <div className="font-medium text-gray-700">Thời gian dự kiến:</div>
          <div className="text-base">{estimatedDuration}</div>
        </div>
      )}
    </aside>
  );
}

export default function STITestingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<StiTestProcess[] | null>(null);
  const [error, setError] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<string | null>(
    null
  );
  const router = useRouter();

  // Lấy danh sách dịch vụ STI
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const fetchedServices = await APIService.getStiServices(); // Use new getStiServices
        if (Array.isArray(fetchedServices)) {
          setServices(fetchedServices);
        } else {
          console.error("Expected fetchedServices to be an array but got:", fetchedServices);
          setServices([]);
        }
      } catch (error: any) {
        console.error("Error fetching STI services:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách dịch vụ xét nghiệm STI.",
          variant: "destructive",
        });
        setServices([]);
      }
    };
    fetchServices();
  }, [toast]);

  // Lấy thông tin chi tiết chi phí, thời gian dự kiến khi chọn dịch vụ
  useEffect(() => {
    if (!user?.id || selectedServiceIds.length === 0) {
      setEstimatedCost(null);
      setEstimatedDuration(null);
      return;
    }
    const fetchEstimatedCost = async () => {
      try {
        const response = await STITestingService.getBookingEstimation({
          patientId: user.id,
          serviceIds: selectedServiceIds,
          notes: "Tạm tính chi phí",
        });
        setEstimatedCost(response.estimatedCost);
        setEstimatedDuration(response.estimatedDuration);
      } catch (error) {
        console.error("Error fetching estimated cost:", error);
        setEstimatedCost(null);
        setEstimatedDuration(null);
      }
    };
    fetchEstimatedCost();
    // eslint-disable-next-line
  }, [selectedServiceIds, user?.id]);

  // Step 1: Chọn dịch vụ
  const handleSelectService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Step 4: Đặt lịch
  const handleBook = async () => {
    if (
      !user?.id ||
      selectedServiceIds.length === 0 ||
      !selectedDate ||
      !selectedTime
    ) {
      setError("Vui lòng chọn đầy đủ thông tin");
      return;
    }
    setBookingLoading(true);
    setError("");
    try {
      const bookedResults: StiTestProcess[] = [];
      for (const serviceId of selectedServiceIds) {
        const sampleCollectionDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(":").map(Number);
        sampleCollectionDateTime.setHours(hours, minutes, 0, 0);

        const payload: STITestData = {
          serviceId: serviceId,
          patientId: user.id,
          sampleType: "blood", // Default, ideally from UI
          priority: "normal", // Default, ideally from UI
          sampleCollectionLocation: "office", // Default, ideally from UI
          processNotes: notes,
          estimatedResultDate: sampleCollectionDateTime.toISOString(), // Use collection date for estimation
        };
        const response = await STITestingService.createTest(payload);
        bookedResults.push(response);
      }

      setBookingResult(bookedResults); // Store all results
      setStep(4);
    } catch (e: any) {
      console.error("Booking error:", e);
      setError(e?.message || "Không thể đặt lịch. Vui lòng thử lại sau.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Lấy danh sách dịch vụ đã chọn
  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id)
  );

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-start">
      <div className="flex-1 max-w-2xl min-h-[600px]">
        <StiStepper step={step} steps={steps} />
        {step === 0 && (
          <div>
            <h2 className="text-3xl font-extrabold mb-8 text-primary">
              Chọn dịch vụ xét nghiệm STI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {services.map((service) => (
                <StiServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedServiceIds.includes(service.id)}
                  onSelect={() => handleSelectService(service.id)}
                />
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button disabled className="rounded-full px-8 py-3 text-lg">
                Quay lại
              </Button>
              <Button
                onClick={() => setStep(1)}
                disabled={selectedServiceIds.length === 0}
                className="btn-primary rounded-full px-8 py-3 text-lg shadow-lg"
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Xác nhận thông tin cá nhân
            </h2>
            <div className="mb-4">
              <div className="mb-2">
                Họ tên: <span className="font-medium">{user?.fullName}</span>
              </div>
              <div className="mb-2">
                Email: <span className="font-medium">{user?.email}</span>
              </div>
              {/* Có thể bổ sung các trường khác nếu cần */}
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(0)}>Quay lại</Button>
              <Button onClick={() => setStep(2)} className="btn-primary">
                Tiếp tục
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Chọn ngày & giờ xét nghiệm
            </h2>
            <div className="mb-4">
              <label className="font-medium block mb-2">Chọn ngày</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div className="mb-4">
              <label className="font-medium block mb-2">Chọn giờ</label>
              <div className="flex gap-2 flex-wrap">
                {["09:00", "10:00", "11:00", "14:00", "15:00"].map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="btn-primary"
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Xác nhận & đặt lịch</h2>
            <div className="mb-4">
              <label className="font-medium block mb-2">Ghi chú (nếu có)</label>
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú cho phòng khám, ví dụ: ưu tiên buổi sáng, ..."
              />
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(2)}>Quay lại</Button>
              <Button
                onClick={handleBook}
                disabled={bookingLoading}
                className="btn-primary"
              >
                {bookingLoading ? "Đang đặt lịch..." : "Xác nhận & Đặt lịch"}
              </Button>
            </div>
          </div>
        )}
        {step === 4 && bookingResult && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-primary">
              Đặt lịch thành công!
            </h2>
            <div className="mb-2">
              Mã xét nghiệm:{" "}
              <span className="font-mono font-bold">
                {bookingResult?.[0]?.testCode || "N/A"}
              </span>
            </div>
            <div className="mb-2">
              Số lượng xét nghiệm đã đặt:{" "}
              <span className="font-medium">{bookingResult.length}</span>
            </div>
            <div className="mb-2">
              Tổng chi phí:{" "}
              <span className="font-bold text-primary">
                {estimatedCost?.toLocaleString() || "0"}đ
              </span>
            </div>
            <div className="mb-2">
              Thời gian dự kiến có kết quả:{" "}
              <span className="font-medium">
                {estimatedDuration || "N/A"}
              </span>
            </div>
            <Button
              className="mt-4"
              onClick={() => {
                setStep(0);
                setSelectedServiceIds([]);
                setSelectedDate(undefined);
                setSelectedTime("");
                setNotes("");
                setBookingResult(null);
              }}
            >
              Đặt thêm xét nghiệm khác
            </Button>
          </div>
        )}
      </div>
      <div className="w-full md:w-96 mt-8 md:mt-24 ml-auto">
        <StiSummarySidebar
          selectedServices={selectedServices}
          user={user}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          estimatedCost={estimatedCost}
          estimatedDuration={estimatedDuration}
        />
      </div>
    </div>
  );
}
