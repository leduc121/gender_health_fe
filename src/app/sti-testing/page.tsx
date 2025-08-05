"use client";

import AuthDialog from "@/components/AuthDialog"; // Import AuthDialog
import StiServiceCard from "@/components/StiServiceCard";
import StiStepper from "@/components/StiStepper";
import StiSummarySidebar from "@/components/StiSummarySidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { APIService } from "@/services/service.service"; // Import ServiceService and Service
import { STITestingService } from "@/services/sti-testing.service"; // Import STITestingService
import {
  Appointment,
  AvailableSlotDto,
  CreateStiAppointmentDto,
  FindAvailableSlotsDto,
} from "@/types/sti-appointment.d"; // Import new DTOs and types
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const steps = [
  "Chọn dịch vụ",
  "Xác nhận thông tin",
  "Chọn ngày & giờ",
  "Xác nhận & đặt lịch",
  "Hoàn tất",
];

export default function STITestingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<Appointment[] | null>(
    null
  );
  const [error, setError] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<string | null>(
    null
  );
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotDto[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotDto | null>(
    null
  );
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12">
        <div className="bg-muted/50 rounded-lg p-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Yêu cầu đăng nhập</h2>
          <p className="text-muted-foreground mb-6">
            Vui lòng đăng nhập để sử dụng dịch vụ tư vấn trực tuyến
          </p>
          <AuthDialog
            trigger={<Button variant="outline">Đăng nhập ngay</Button>}
          />
        </div>
      </div>
    );
  }

  // Lấy danh sách dịch vụ STI
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await APIService.getAll();
        const allServices = response.data;
        const stiServices = allServices.filter(
          (service) =>
            service.name.toLowerCase().includes("sti") ||
            (service.type && service.type.toLowerCase().includes("sti")) // Assuming a 'type' field might exist for service classification
        );
        setServices(stiServices);
      } catch (error: any) {
        console.error("Error fetching all services for STI page:", error);
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

  // Lấy các slot thời gian khả dụng
  useEffect(() => {
    if (!selectedDate || selectedServiceIds.length === 0) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSelectedTime("");
      return;
    }

    const fetchAvailableSlots = async () => {
      try {
        const startDate = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const endDate = startDate; // Search for slots on the selected date only

        const payload: FindAvailableSlotsDto = {
          serviceIds: selectedServiceIds,
          startDate: startDate,
          endDate: endDate,
          // Optionally add startTime/endTime if you want to filter by fixed hours
          // startTime: "08:00",
          // endTime: "17:00",
        };

        const response =
          await STITestingService.getAvailableAppointmentSlots(payload);
        let slots = response.availableSlots.filter(
          (slot) => slot.remainingSlots > 0
        );

        // Deduplicate slots by availabilityId to ensure unique keys for rendering
        const uniqueSlotsMap = new Map<string, AvailableSlotDto>();
        for (const slot of slots) {
          if (!uniqueSlotsMap.has(slot.availabilityId)) {
            uniqueSlotsMap.set(slot.availabilityId, slot);
          }
        }
        slots = Array.from(uniqueSlotsMap.values());

        // Sort slots by time
        slots.sort((a, b) => {
          const timeA =
            new Date(a.dateTime).getHours() * 60 +
            new Date(a.dateTime).getMinutes();
          const timeB =
            new Date(b.dateTime).getHours() * 60 +
            new Date(b.dateTime).getMinutes();
          return timeA - timeB;
        });

        setAvailableSlots(slots);
        // Reset selected slot if current selected time is not in new available slots
        if (
          selectedTime &&
          !slots.find(
            (s) =>
              new Date(s.dateTime).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }) === selectedTime
          )
        ) {
          setSelectedTime("");
          setSelectedSlot(null);
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
        setAvailableSlots([]);
        setSelectedSlot(null);
        setSelectedTime("");
        toast({
          title: "Lỗi",
          description: "Không thể tải các slot thời gian khả dụng.",
          variant: "destructive",
        });
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, selectedServiceIds, toast]);

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
      !selectedSlot // Changed from selectedTime to selectedSlot
    ) {
      setError("Vui lòng chọn đầy đủ thông tin");
      return;
    }
    setBookingLoading(true);
    setError("");
    try {
      const bookedResults: Appointment[] = [];

      const sampleCollectionDateTime = new Date(selectedSlot.dateTime);

      for (const serviceId of selectedServiceIds) {
        const payload: CreateStiAppointmentDto = {
          stiServiceId: serviceId,
          sampleCollectionDate: sampleCollectionDateTime.toISOString(),
          sampleCollectionLocation: "office",
          notes: notes,
          consultantId: selectedSlot.consultant?.id, // Pass consultantId from selected slot
        };
        const response = await STITestingService.createStiAppointment(payload);
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
      <div className="flex-1 max-w-3xl min-h-[600px]">
        <StiStepper step={step} steps={steps} />
        {step === 0 && (
          <div>
            <h2 className="text-3xl font-extrabold mb-8 text-primary">
              Chọn dịch vụ xét nghiệm STI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {services.length > 0 ? (
                services.map((service) => (
                  <StiServiceCard
                    key={service.id}
                    service={service}
                    selected={selectedServiceIds.includes(service.id)}
                    onSelect={() => handleSelectService(service.id)}
                  />
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center">
                  Không tìm thấy dịch vụ xét nghiệm STI nào.
                </p>
              )}
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
                className="rounded-2xl border shadow-lg p-4 bg-white"
                fromDate={new Date()}
                modifiersClassNames={{
                  selected: "bg-primary text-white rounded-lg",
                  today: "border border-primary rounded-lg",
                  outside: "text-muted-foreground opacity-50",
                  day: "hover:bg-primary/10 rounded-lg",
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
            </div>
            <div className="mb-4">
              <label className="font-medium block mb-2">Chọn giờ</label>
              <div className="flex gap-2 flex-wrap">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => {
                    const time = new Date(slot.dateTime).toLocaleTimeString(
                      "en-GB",
                      { hour: "2-digit", minute: "2-digit" }
                    );
                    return (
                      <Button
                        key={slot.availabilityId} // Use availabilityId as key
                        variant={
                          selectedSlot?.availabilityId === slot.availabilityId
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedTime(time);
                          setSelectedSlot(slot);
                        }}
                      >
                        {time} ({slot.remainingSlots} còn trống)
                      </Button>
                    );
                  })
                ) : (
                  <p className="text-gray-500">
                    Không có slot khả dụng cho ngày đã chọn.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(1)}>Quay lại</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedSlot} // Changed from selectedTime to selectedSlot
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
              ID lịch hẹn:{" "}
              <span className="font-mono font-bold">
                {bookingResult?.[0]?.id || "N/A"}
              </span>
            </div>
            <div className="mb-2">
              Số lượng lịch hẹn đã đặt:{" "}
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
              <span className="font-medium">{estimatedDuration || "N/A"}</span>
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
