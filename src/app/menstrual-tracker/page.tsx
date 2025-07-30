"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MenstrualService,
  Prediction,
  ContraceptiveReminder,
  CreateContraceptiveReminderDto,
  CreateCycleDto,
} from "@/services/menstrual.service";
import { MenstrualCycleHistory } from "@/components/MenstrualCycleHistory";
import { ApiResponse, UpdateHealthDataConsentDto } from "@/types/api.d";
import { apiClient } from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";
import { format } from "date-fns";

export default function MenstrualTrackerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [menstrualTrackingConsent, setMenstrualTrackingConsent] = useState(false);
  const [userHealthDataConsent, setUserHealthDataConsent] = useState<boolean | null>(null);

  // Contraceptive Reminders State
  const [contraceptiveReminders, setContraceptiveReminders] = useState<ContraceptiveReminder[]>([]);
  const [showContraceptiveReminderDialog, setShowContraceptiveReminderDialog] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<ContraceptiveReminder | null>(null);
  const [newReminderForm, setNewReminderForm] = useState<CreateContraceptiveReminderDto>({
    contraceptiveType: "",
    reminderTime: "",
    startDate: "",
    frequency: "daily",
    daysOfWeek: [],
    reminderMessage: "",
  });
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (user) {
      const initialConsent = user.healthDataConsent || false;
      setUserHealthDataConsent(initialConsent);
      
      // Prompt for consent only if it has never been set
      if (user.gender === 'F' && user.healthDataConsent === null) {
        setMenstrualTrackingConsent(true);
      } else {
        setMenstrualTrackingConsent(initialConsent);
      }
      
      fetchPrediction();
      fetchContraceptiveReminders();
    }
  }, [user]);

  // Fetch the next cycle prediction
  const fetchPrediction = async () => {
    try {
      const res: Prediction = await MenstrualService.getPredictions();
      setPrediction(res);
    } catch {
      setPrediction(null);
    }
  };

  // Fetch all contraceptive reminders
  const fetchContraceptiveReminders = async () => {
    try {
      const res: ApiResponse<ContraceptiveReminder[]> = await MenstrualService.getAllContraceptiveReminders();
      setContraceptiveReminders(res.data || []);
    } catch (e: any) {
      console.error("Error fetching contraceptive reminders:", e);
      setContraceptiveReminders([]);
    }
  };

  // Update user's health data consent
  const handleUpdateHealthDataConsent = async (consent: boolean) => {
    try {
      await apiClient.patch(API_ENDPOINTS.USERS.PROFILE + "/health-data-consent", {
        healthDataConsent: consent,
      } as UpdateHealthDataConsentDto);
      setUserHealthDataConsent(consent);
      toast({
        title: "Thành công",
        description: "Đã cập nhật quyền thu thập dữ liệu sức khỏe.",
      });
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể cập nhật quyền thu thập dữ liệu sức khỏe.",
        variant: "destructive",
      });
      throw e; // Re-throw to be caught by the calling function
    }
  };

  // Create a new menstrual cycle entry
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Lỗi", description: "Bạn cần đăng nhập để tạo chu kỳ mới.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Lỗi", description: "Vui lòng chọn ngày bắt đầu và kết thúc.", variant: "destructive" });
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast({ title: "Lỗi", description: "Ngày bắt đầu không thể sau ngày kết thúc.", variant: "destructive" });
      return;
    }
    if (user.gender === 'F' && !menstrualTrackingConsent) {
        toast({ title: "Lỗi", description: "Bạn cần đồng ý cho phép thu thập dữ liệu sức khỏe để theo dõi chu kỳ kinh nguyệt.", variant: "destructive" });
        return;
    }

    setCreating(true);
    try {
      // If consent was just given, update it first
      if (user.gender === 'F' && menstrualTrackingConsent && !userHealthDataConsent) {
        await handleUpdateHealthDataConsent(true);
      }

      const cycleData: CreateCycleDto = {
        cycleStartDate: startDate,
        cycleEndDate: endDate,
      };
      await MenstrualService.createCycle(cycleData);
      toast({ title: "Thành công", description: "Đã tạo chu kỳ mới!" });
      setStartDate("");
      setEndDate("");
      fetchPrediction(); // Refresh prediction after creating a new cycle
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể tạo chu kỳ",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Open the dialog to create a new reminder
  const handleOpenCreateReminderDialog = () => {
    setCurrentReminder(null);
    setNewReminderForm({
      contraceptiveType: "",
      reminderTime: "",
      startDate: "",
      frequency: "daily",
      daysOfWeek: [],
      reminderMessage: "",
    });
    setShowContraceptiveReminderDialog(true);
  };

  // Open the dialog to edit an existing reminder
  const handleOpenEditReminderDialog = (reminder: ContraceptiveReminder) => {
    setCurrentReminder(reminder);
    setNewReminderForm({
      contraceptiveType: reminder.contraceptiveType,
      reminderTime: reminder.reminderTime,
      startDate: format(new Date(reminder.startDate), "yyyy-MM-dd"),
      endDate: reminder.endDate ? format(new Date(reminder.endDate), "yyyy-MM-dd") : undefined,
      frequency: reminder.frequency,
      daysOfWeek: reminder.daysOfWeek || [],
      reminderMessage: reminder.reminderMessage || "",
    });
    setShowContraceptiveReminderDialog(true);
  };

  // Save a new or updated reminder
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReminder(true);
    try {
      if (currentReminder) {
        await MenstrualService.updateContraceptiveReminder(currentReminder.id, newReminderForm);
        toast({ title: "Thành công", description: "Đã cập nhật nhắc nhở tránh thai!" });
      } else {
        await MenstrualService.createContraceptiveReminder(newReminderForm);
        toast({ title: "Thành công", description: "Đã tạo nhắc nhở tránh thai mới!" });
      }
      setShowContraceptiveReminderDialog(false);
      fetchContraceptiveReminders();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể lưu nhắc nhở tránh thai",
        variant: "destructive",
      });
    } finally {
      setSavingReminder(false);
    }
  };

  // Delete a reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      await MenstrualService.deleteContraceptiveReminder(id);
      toast({ title: "Thành công", description: "Đã xóa nhắc nhở tránh thai!" });
      fetchContraceptiveReminders();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể xóa nhắc nhở tránh thai",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Theo dõi chu kỳ kinh nguyệt</h1>
      
      {/* Prediction Block */}
      {prediction && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dự đoán kỳ tiếp theo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div><b>Ngày bắt đầu dự đoán:</b> {prediction.predictedCycleStart ? format(new Date(prediction.predictedCycleStart), "dd/MM/yyyy") : "N/A"}</div>
              <div><b>Ngày kết thúc dự đoán:</b> {prediction.predictedCycleEnd ? format(new Date(prediction.predictedCycleEnd), "dd/MM/yyyy") : "N/A"}</div>
              <div><b>Ngày rụng trứng dự đoán:</b> {prediction.predictedOvulationDate ? format(new Date(prediction.predictedOvulationDate), "dd/MM/yyyy") : "N/A"}</div>
              <div><b>Khoảng thụ thai cao:</b> {prediction.predictedFertileStart && prediction.predictedFertileEnd ? `${format(new Date(prediction.predictedFertileStart), "dd/MM/yyyy")} - ${format(new Date(prediction.predictedFertileEnd), "dd/MM/yyyy")}` : "N/A"}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Cycle Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thêm chu kỳ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Ngày bắt đầu</label>
              <input type="date" className="border rounded px-2 py-1 w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày kết thúc</label>
              <input type="date" className="border rounded px-2 py-1 w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            {user?.gender === 'F' && (
              <div className="flex items-center space-x-2">
                <Checkbox id="menstrual-tracking-consent" checked={menstrualTrackingConsent} onCheckedChange={(checked: boolean) => setMenstrualTrackingConsent(checked)} />
                <Label htmlFor="menstrual-tracking-consent" className="text-sm font-medium leading-none">
                  Cho phép thu thập thông tin để theo dõi chu kỳ kinh nguyệt
                </Label>
              </div>
            )}
            <Button type="submit" disabled={creating}>
              {creating ? "Đang lưu..." : "Lưu chu kỳ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cycle History */}
      <MenstrualCycleHistory />

      {/* Contraceptive Reminders Block */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Nhắc nhở tránh thai</CardTitle>
          <Button onClick={handleOpenCreateReminderDialog}>Thêm nhắc nhở</Button>
        </CardHeader>
        <CardContent>
          {contraceptiveReminders.length === 0 ? (
            <div className="text-center text-gray-500">Chưa có nhắc nhở nào.</div>
          ) : (
            <ul className="space-y-4">
              {contraceptiveReminders.map((reminder) => (
                <li key={reminder.id} className="border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">{reminder.contraceptiveType}</h3>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEditReminderDialog(reminder)}>Sửa</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteReminder(reminder.id)}>Xóa</Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">Thời gian: {reminder.reminderTime} | Tần suất: {reminder.frequency}</p>
                  <p className="text-sm text-gray-700">Từ ngày: {format(new Date(reminder.startDate), "dd/MM/yyyy")} {reminder.endDate && ` đến ${format(new Date(reminder.endDate), "dd/MM/yyyy")}`}</p>
                  {reminder.frequency === "weekly" && reminder.daysOfWeek && reminder.daysOfWeek.length > 0 && (
                    <p className="text-sm text-gray-700">Các ngày: {reminder.daysOfWeek.map(day => ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][day]).join(", ")}</p>
                  )}
                  {reminder.reminderMessage && <p className="text-sm text-gray-700 mt-1">Tin nhắn: {reminder.reminderMessage}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Reminder Dialog */}
      <Dialog open={showContraceptiveReminderDialog} onOpenChange={setShowContraceptiveReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentReminder ? "Sửa nhắc nhở tránh thai" : "Thêm nhắc nhở tránh thai mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveReminder} className="space-y-4">
            <div>
              <Label htmlFor="contraceptiveType">Loại thuốc/phương pháp</Label>
              <Input id="contraceptiveType" value={newReminderForm.contraceptiveType} onChange={(e) => setNewReminderForm({ ...newReminderForm, contraceptiveType: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="reminderTime">Thời gian nhắc nhở (HH:mm)</Label>
              <Input id="reminderTime" type="time" value={newReminderForm.reminderTime} onChange={(e) => setNewReminderForm({ ...newReminderForm, reminderTime: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input id="startDate" type="date" value={newReminderForm.startDate} onChange={(e) => setNewReminderForm({ ...newReminderForm, startDate: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="endDate">Ngày kết thúc (Không bắt buộc)</Label>
              <Input id="endDate" type="date" value={newReminderForm.endDate || ""} onChange={(e) => setNewReminderForm({ ...newReminderForm, endDate: e.target.value || undefined })} />
            </div>
            <div>
              <Label htmlFor="frequency">Tần suất</Label>
              <Select value={newReminderForm.frequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setNewReminderForm({ ...newReminderForm, frequency: value })}>
                <SelectTrigger><SelectValue placeholder="Chọn tần suất" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Hàng ngày</SelectItem>
                  <SelectItem value="weekly">Hàng tuần</SelectItem>
                  <SelectItem value="monthly">Hàng tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newReminderForm.frequency === "weekly" && (
              <div>
                <Label>Các ngày trong tuần</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"].map((day, index) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox id={`day-${index}`} checked={newReminderForm.daysOfWeek?.includes(index)} onCheckedChange={(checked) => {
                        const updatedDays = checked ? [...(newReminderForm.daysOfWeek || []), index] : (newReminderForm.daysOfWeek || []).filter((d) => d !== index);
                        setNewReminderForm({ ...newReminderForm, daysOfWeek: updatedDays.sort() });
                      }} />
                      <Label htmlFor={`day-${index}`}>{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="reminderMessage">Tin nhắn nhắc nhở (Không bắt buộc)</Label>
              <Input id="reminderMessage" value={newReminderForm.reminderMessage || ""} onChange={(e) => setNewReminderForm({ ...newReminderForm, reminderMessage: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={savingReminder}>
                {savingReminder ? "Đang lưu..." : "Lưu nhắc nhở"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
