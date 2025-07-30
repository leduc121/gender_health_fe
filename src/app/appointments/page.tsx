"use client";

import { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { AppointmentService } from "@/services/appointment.service";
import { STITestingService } from "@/services/sti-testing.service"; // Import STITestingService
import { APIService, Service } from "@/services/service.service"; // Import APIService and Service interface
import { useSearchParams, useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
// import { AuthContext } from "@/contexts/AuthContext"; // Uncomment if you have AuthContext

// Using Service type directly from service.service.ts
// The previous PackageService type and related imports are no longer needed.

// API: Get available slots (for consultant-required services)
async function getAvailableSlots({
  serviceIds,
  startDate,
  endDate,
  startTime,
  endTime,
  token,
}: {
  serviceIds: string[];
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  token: string;
}) {
  const body = {
    serviceIds,
    startDate,
    ...(endDate ? { endDate } : {}),
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
  };
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/appointments/available-slots`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error("Không thể lấy slot khả dụng");
  return res.json();
}

// API: Book appointment (using AppointmentService for consistency)
// Removed the direct fetch function and will use AppointmentService.createAppointment directly within handleBookAppointment

export default function AppointmentsPage() {
  // const { user } = useContext(AuthContext); // Uncomment if you have AuthContext
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]); // Changed from PackageService[] to Service[]
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("[AppointmentsPage] Fetching services from APIService.getAll()");
    setLoadingServices(true);
    APIService.getAll()
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          console.error("[AppointmentsPage] Expected an array from APIService.getAll(), but received:", data);
          setServices([]);
        }
      })
      .catch((error) => {
        console.error("[AppointmentsPage] Error fetching services:", error);
        setServices([]);
      })
      .finally(() => {
        setLoadingServices(false);
      });
  }, []);

  useEffect(() => {
    if (!loadingServices && services.length > 0) {
    
      const serviceIdFromUrl = searchParams.get("serviceId"); // Use "serviceId" as parameter name
      if (serviceIdFromUrl) {
        // Find Service directly by its ID
        const foundService = services.find((s) => s.id === serviceIdFromUrl);
        if (foundService) {
          // Add service ID to selectedServiceIds
          setSelectedServiceIds((prev) => {
            if (!prev.includes(foundService.id)) {
              return [...prev, foundService.id];
            }
            return prev;
          });
          setStep(2); // Automatically advance to step 2
        } else {
          toast({
            title: "Dịch vụ không khả dụng",
            description: "Dịch vụ bạn chọn không thể tải hoặc không còn khả dụng. Vui lòng chọn dịch vụ khác.",
            variant: "destructive",
          });
        }
      }
    }
  }, [loadingServices, services, searchParams, toast]);
  

  const selectedServices = services
    .filter((s) => selectedServiceIds.includes(s.id)); // No longer need to map s.service


  const needsConsultant = selectedServices.some((s) => s.requiresConsultant);

  // Lấy slot nếu cần tư vấn viên
  useEffect(() => {
    if (needsConsultant && selectedServiceIds.length && selectedDate) {
      setLoadingSlots(true);
      const startDate = selectedDate.toISOString().slice(0, 10);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      if (!token) {
        setLoadingSlots(false);
        toast({
          title: "Lỗi xác thực",
          description: "Bạn cần đăng nhập để xem slot tư vấn.",
          variant: "destructive",
        });
        return;
      }
      // mappedServiceIds directly uses selectedServiceIds since they are already service IDs
      const mappedServiceIds = selectedServiceIds;

      getAvailableSlots({
        serviceIds: mappedServiceIds,
        startDate,
        token,
      })
        .then((data) => {
          if (data?.data?.availableSlots) {
            setAvailableSlots(data.data.availableSlots);
          } else if (data?.data?.message) {
            toast({ title: "Thông báo", description: data.data.message });
            setAvailableSlots([]);
          } else {
            setAvailableSlots([]);
          }
        })
        .catch(() => {
          toast({ title: "Lỗi", description: "Không thể lấy slot tư vấn." });
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [needsConsultant, selectedServiceIds, selectedDate, services.length]);

  // Reset selectedSlot khi đổi ngày hoặc dịch vụ
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedServiceIds]);

  // Reset selectedTime khi đổi ngày hoặc dịch vụ
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate, selectedServiceIds]);

  const handleBookAppointment = async () => {
    if (!selectedDate || selectedServiceIds.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn dịch vụ và ngày.",
        variant: "destructive",
      });
      return;
    }
    if (needsConsultant && !selectedSlot) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khung giờ và tư vấn viên.",
        variant: "destructive",
      });
      return;
    }
    if (!needsConsultant && !selectedTime) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn giờ.",
        variant: "destructive",
      });
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (!token) {
      toast({
        title: "Lỗi xác thực",
        description: "Bạn cần đăng nhập để đặt lịch.",
        variant: "destructive",
      });
      return;
    }


    try {
      const firstSelectedService = services.find((s) => selectedServiceIds.includes(s.id));
      const isStiService = firstSelectedService?.type === 'STI_TEST'; // Giả định có trường `type` để phân biệt dịch vụ STI

      if (isStiService) {
        // Handle STI Appointment
        if (!selectedDate || !selectedTime) {
          toast({
            title: "Lỗi",
            description: "Vui lòng chọn ngày và giờ lấy mẫu.",
            variant: "destructive",
          });
          return;
        }

        const [year, month, day] = [
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        ];
        const [hour, minute] = selectedTime.split(":").map(Number);
        
        // Construct date in local timezone and format it to ISO 8601 string without timezone offset
        // This ensures the backend receives the exact local time components
        const localDate = new Date(year, month, day, hour, minute, 0, 0);
        const pad = (num: number) => num < 10 ? '0' + num : num;
        const sampleCollectionDate = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:00`;
        
        const sampleCollectionLocation: "office" = "office"; // STI tests are typically at an office

        const stiAppointmentData = {
          stiServiceId: firstSelectedService.id,
          consultantId: selectedSlot?.consultant?.id,
          sampleCollectionDate,
          sampleCollectionLocation,
          notes,
        };

        await STITestingService.createStiAppointment(stiAppointmentData);

      } else {
        // Handle General Appointment
        let appointmentDate = "";
        let consultantId: string | undefined = undefined;
        const appointmentLocation: "online" = "online"; // Default to online as per user feedback

        if (needsConsultant) {
          appointmentDate = selectedSlot.dateTime;
          consultantId = selectedSlot.consultant?.id;
        } else {
          if (!selectedDate || !selectedTime) {
            toast({
              title: "Lỗi",
              description: "Vui lòng chọn ngày và giờ.",
              variant: "destructive",
            });
            return;
          }
          const [year, month, day] = [
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
          ];
          const [hour, minute] = selectedTime.split(":").map(Number);

          // Construct date in local timezone and format it to ISO 8601 string without timezone offset
          const localDate = new Date(year, month, day, hour, minute, 0, 0);
          const pad = (num: number) => num < 10 ? '0' + num : num;
          appointmentDate = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:00`;
        }

        const generalAppointmentData = {
          serviceIds: selectedServiceIds,
          consultantId,
          appointmentDate,
          appointmentLocation,
          notes,
        };

        await AppointmentService.createAppointment(generalAppointmentData);
      }

      setBooking({ success: true, message: "Đặt lịch thành công!" });
      toast({
        title: "Thành công",
        description: "Lịch hẹn của bạn đã được đặt thành công.",
      });
      setStep(5); // Changed to step 5 for success message
      setSelectedServiceIds([]);
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedSlot(null);
      setNotes("");
      setTimeout(() => {
        router.push("/profile/appointments");
      }, 1500);
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể đặt lịch. Vui lòng thử lại.";
      setBooking({ success: false, message: errorMessage });
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Refactored handler for service selection
  const handleServiceSelect = (item: Service) => {
    const isStiServiceType = item.type === 'STI_TEST';
    const hasStiServiceSelected = selectedServices.some(s => s.type === 'STI_TEST');

    if (isStiServiceType) {
      // If an STI service is clicked, it becomes the only selected service, or deselects if already selected.
      setSelectedServiceIds(prev =>
        prev.includes(item.id) ? [] : [item.id]
      );
    } else if (hasStiServiceSelected) {
      // If an STI service is already selected, prevent selecting any other type of service.
      toast({
        title: "Lưu ý",
        description: "Bạn không thể chọn dịch vụ khác khi đã chọn dịch vụ xét nghiệm STI.",
        variant: "default",
      });
    } else {
      // For general services, allow multiple selections.
      setSelectedServiceIds((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
    }
  };


  // Phân quyền: chỉ Customer mới đặt được lịch (giả sử user?.role === 'customer')
  // const canBook = user?.role === 'customer';
  const canBook = true; // TODO: thay bằng kiểm tra role thực tế

  // Tóm tắt thông tin đã chọn
  const summary = (
    <div className="sticky top-8 bg-white rounded-xl shadow-lg p-6 border w-full max-w-md mx-auto mb-8">
      <h3 className="text-xl font-bold mb-4 text-primary">Tóm tắt đặt lịch</h3>
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Dịch vụ:</span>
          <ul className="list-disc ml-6 mt-1">
            {selectedServices.map((service) => (
              <li key={service.id} className="mb-1">
                <span className="text-primary font-medium">{service.name}</span>
                {service.price !== null && (
                  <span className="ml-2 text-green-700">
                    ({service.price.toLocaleString()} VNĐ)
                  </span>
                  )}
                {service.requiresConsultant && (
                  <span className="ml-2 text-xs text-blue-600">
                    [Cần tư vấn viên]
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="font-semibold">Ngày:</span>{" "}
          {selectedDate ? selectedDate.toLocaleDateString() : "-"}
        </div>
        <div>
          <span className="font-semibold">Giờ:</span>{" "}
          {needsConsultant
            ? selectedSlot?.dateTime
              ? new Date(selectedSlot.dateTime).toLocaleTimeString()
              : "-"
            : selectedTime}
        </div>
        {needsConsultant && (
          <div>
            <span className="font-semibold">Tư vấn viên:</span>{" "}
            {selectedSlot?.consultant
              ? `${selectedSlot.consultant.lastName} ${selectedSlot.consultant.firstName}`
              : "-"}
          </div>
        )}
        <div>
          <span className="font-semibold">Nơi chốn:</span>{" "}
          Online
        </div>
        {notes && (
          <div>
            <span className="font-semibold">Ghi chú:</span> {notes}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-primary drop-shadow-sm tracking-tight mb-10" aria-label="Đặt lịch hẹn">
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Đặt lịch hẹn
        </span>
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Bước {step} / 4</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Bước 1: Chọn dịch vụ */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-4" aria-label="Bước 1: Chọn dịch vụ">1. Chọn dịch vụ</h2>
                  {loadingServices ? (
                    <div className="text-center py-8" role="status" aria-live="polite">Đang tải dịch vụ...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-4 flex flex-col gap-2 shadow-sm transition cursor-pointer hover:border-primary ${selectedServiceIds.includes(item.id) ? "border-primary bg-primary/5" : ""}`}
                          onClick={() => handleServiceSelect(item)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleServiceSelect(item);
                            }
                          }}
                          role="checkbox"
                          aria-checked={selectedServiceIds.includes(item.id)}
                          aria-label={`Chọn dịch vụ ${item.name}`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedServiceIds.includes(item.id)}
                              aria-hidden="true" // Checkbox is visually present, but its state is controlled by the parent div's click/keydown
                            />
                            <span className="font-semibold text-lg text-primary">
                              {item.name}
                            </span>
                            {item.requiresConsultant && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs text-blue-600 border-blue-300"
                              >
                                Cần tư vấn viên
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs mt-1">
                            <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Giá:{" "}
                              {item.price !== null
                                ? `${item.price.toLocaleString()} VNĐ`
                                : "Miễn phí"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-8 flex justify-end">
                    <Button
                      size="lg"
                      onClick={() => setStep(2)}
                      disabled={selectedServiceIds.length === 0}
                      aria-label="Tiếp tục đến bước chọn ngày"
                    >
                      Tiếp tục
                    </Button>
                  </div>
                </div>
              )}
              {/* Bước 2: Chọn ngày */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-4" aria-label="Bước 2: Chọn ngày">2. Chọn ngày</h2>
                  <div className="flex flex-col md:flex-row gap-8">
                    <div>
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        fromDate={new Date()}
                        modifiers={{
                          available: (date) => {
                            if (needsConsultant && availableSlots.length > 0) {
                              return availableSlots.some((slot) => {
                                const slotDate = new Date(slot.dateTime);
                                return (
                                  slotDate.getFullYear() ===
                                    date.getFullYear() &&
                                  slotDate.getMonth() === date.getMonth() &&
                                  slotDate.getDate() === date.getDate()
                                );
                              });
                            }
                            return true;
                          },
                        }}
                        modifiersClassNames={{
                          selected: "bg-primary text-white rounded-lg",
                          today: "border border-primary rounded-lg",
                          outside: "text-muted-foreground opacity-50",
                          day: "hover:bg-primary/10 rounded-lg",
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          if (date < today) return true;

                          if (needsConsultant && availableSlots.length > 0) {
                            return !availableSlots.some((slot) => {
                              const slotDate = new Date(slot.dateTime);
                              return (
                                slotDate.getFullYear() === date.getFullYear() &&
                                slotDate.getMonth() === date.getMonth() &&
                                slotDate.getDate() === date.getDate()
                              );
                            });
                          }
                          return false;
                        }}
                        className="rounded-2xl border shadow-lg p-4 bg-white"
                        showOutsideDays
                        aria-label="Chọn ngày hẹn"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-4 justify-center">
                      <div className="text-lg">
                        Ngày đã chọn:{" "}
                        <span className="font-semibold text-primary">
                          {selectedDate
                            ? selectedDate.toLocaleDateString("vi-VN")
                            : "Chưa chọn"}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setStep(1)}
                          aria-label="Quay lại bước chọn dịch vụ"
                        >
                          Quay lại
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => setStep(3)}
                          disabled={!selectedDate}
                          aria-label="Tiếp tục đến bước chọn khung giờ và tư vấn viên"
                        >
                          Tiếp tục
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Bước 3: Chọn giờ & tư vấn viên */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-4" aria-label="Bước 3: Chọn khung giờ và tư vấn viên">
                    3. Chọn khung giờ & tư vấn viên
                  </h2>
                  {needsConsultant ? (
                    <div>
                      {loadingSlots ? (
                        <div className="text-center py-8" role="status" aria-live="polite">Đang tải slot...</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            if (!selectedDate) return null;

                            const filteredSlots = availableSlots.filter((slot) => {
                              const slotDateLocal = new Date(slot.dateTime).toLocaleDateString();
                              const selectedDateLocal = selectedDate.toLocaleDateString();
                              return slotDateLocal === selectedDateLocal;
                            });

                            const formatTimeKey = (date: Date): string => {
                              const hour = date.getHours().toString().padStart(2, '0');
                              const minute = date.getMinutes().toString().padStart(2, '0');
                              return `${hour}:${minute}`;
                            };

                            const groupedSlots = filteredSlots.reduce((acc: any, slot) => {
                              const dateObj = new Date(slot.dateTime);
                              const normalizedDate = new Date(
                                dateObj.getFullYear(),
                                dateObj.getMonth(),
                                dateObj.getDate(),
                                dateObj.getHours(),
                                dateObj.getMinutes()
                              );
                              const timeKey = formatTimeKey(normalizedDate);

                              if (!acc[timeKey]) {
                                acc[timeKey] = {
                                  displayTime: timeKey,
                                  totalRemainingSlots: 0,
                                  originalSlots: [],
                                };
                              }
                              acc[timeKey].totalRemainingSlots += slot.remainingSlots;
                              acc[timeKey].originalSlots.push(slot);
                              return acc;
                            }, {});

                            const sortedGroupedSlots = Object.values(groupedSlots).sort((a: any, b: any) => {
                              const [aHour, aMinute] = a.displayTime.split(':').map(Number);
                              const [bHour, bMinute] = b.displayTime.split(':').map(Number);
                              if (aHour !== bHour) return aHour - bHour;
                              return aMinute - bMinute;
                            });

                            return sortedGroupedSlots.map((group: any) => {
                               const isSlotSelected = selectedSlot && formatTimeKey(new Date(selectedSlot.dateTime)) === group.displayTime;
                               return (
                                <label
                                  key={group.displayTime}
                                  className={`flex items-center gap-4 p-4 border rounded-xl shadow-sm cursor-pointer transition hover:border-primary ${
                                    isSlotSelected ? "border-primary bg-primary/5" : ""
                                  }`}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setSelectedSlot(group.originalSlots[0]);
                                    }
                                  }}
                                  aria-label={`Chọn khung giờ ${group.displayTime} còn ${group.totalRemainingSlots} slot`}
                                >
                                  <input
                                    type="radio"
                                    name="slot"
                                    checked={Boolean(isSlotSelected)}
                                    onChange={() => setSelectedSlot(group.originalSlots[0])}
                                    className="accent-primary w-5 h-5"
                                    aria-hidden="true" // Radio button is visually present, but its state is controlled by the parent label's click/keydown
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold text-lg text-primary">
                                      {group.displayTime}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Còn {group.totalRemainingSlots} slot
                                    </div>
                                  </div>
                                </label>
                              )
                            });
                          })()}
                        </div>
                      )}
                      <div className="flex gap-4 mt-8">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setStep(2)}
                          aria-label="Quay lại bước chọn ngày"
                        >
                          Quay lại
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => setStep(4)}
                          disabled={!selectedSlot}
                          aria-label="Tiếp tục đến bước ghi chú và xác nhận"
                        >
                          Tiếp tục
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <label className="font-medium" htmlFor="time-select">Chọn giờ</label>
                        <Select
                          value={selectedTime}
                          onValueChange={setSelectedTime}
                        >
                          <SelectTrigger id="time-select" aria-label="Chọn giờ hẹn">
                            <SelectValue placeholder="Chọn giờ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">09:00</SelectItem>
                            <SelectItem value="10:00">10:00</SelectItem>
                            <SelectItem value="11:00">11:00</SelectItem>
                            <SelectItem value="14:00">14:00</SelectItem>
                            <SelectItem value="15:00">15:00</SelectItem>
                            <SelectItem value="16:00">16:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-4 mt-8">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setStep(2)}
                          aria-label="Quay lại bước chọn ngày"
                        >
                          Quay lại
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => setStep(4)}
                          disabled={!selectedTime}
                          aria-label="Tiếp tục đến bước ghi chú và xác nhận"
                        >
                          Tiếp tục
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Bước 4: Ghi chú và xác nhận */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-bold mb-4" aria-label="Bước 4: Ghi chú và Xác nhận">
                    4. Ghi chú và Xác nhận
                  </h2>
                  <div className="mb-4">
                    <label className="font-medium" htmlFor="notes-textarea">Ghi chú</label>
                    <Textarea
                      id="notes-textarea"
                      placeholder="Nhập ghi chú cho buổi hẹn..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      aria-label="Ghi chú cho buổi hẹn"
                    />
                  </div>
                  <div className="flex gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(3)}
                      aria-label="Quay lại bước chọn khung giờ và tư vấn viên"
                    >
                      Quay lại
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleBookAppointment}
                      aria-label="Xác nhận đặt lịch hẹn"
                    >
                      Xác nhận đặt lịch
                    </Button>
                  </div>
                </div>
              )}
              {/* Bước 5: Thông báo kết quả */}
              {step === 5 && booking && (
                <div className="space-y-4 text-center" role="status" aria-live="polite">
                  <h2 className="text-2xl font-bold text-green-600" aria-label={booking.success ? "Đặt lịch thành công!" : "Đặt lịch thất bại"}>
                    {booking.success
                      ? "Đặt lịch thành công!"
                      : "Đặt lịch thất bại"}
                  </h2>
                  <p>{booking.message}</p>
                  <Button
                    size="lg"
                    onClick={() => {
                      setStep(1);
                      setBooking(null);
                    }}
                    aria-label="Đặt lịch mới"
                  >
                    Đặt lịch mới
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-96 flex-shrink-0">
          {step !== 5 && summary}
        </div>
      </div>
    </div>
  );
}