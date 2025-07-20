"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
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
import { useRouter } from "next/navigation";

export default function MenstrualTrackerPage() {
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConsenting, setIsConsenting] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // const [notes, setNotes] = useState<string>(""); // Đã xóa
  const [creating, setCreating] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNotes, setEditNotes] = useState(""); // Giữ lại để sửa, vì Update DTO có thể có
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");

  const handleConsent = async () => {
    setIsConsenting(true);
    try {
      await apiClient.patch("/users/me/health-data-consent", { healthDataConsent: true });
      toast({
        title: "Cảm ơn bạn đã đồng ý!",
        description: "Bây giờ bạn có thể sử dụng tính năng này.",
      });
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu sự đồng ý. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsConsenting(false);
    }
  };

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/menstrual-cycles");
      setCycles((res as any).data || res);
    } catch {
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async () => {
    try {
      const res = await apiClient.get("/menstrual-predictions/me");
      setPrediction((res as any).data || res);
    } catch {
      setPrediction(null);
    }
  };

  useEffect(() => {
    if (user?.gender === "F" && user.healthDataConsent === true) {
      fetchCycles();
      fetchPrediction();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày bắt đầu và kết thúc",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    try {
      // Đã xóa 'notes' khỏi payload
      await apiClient.post("/menstrual-cycles", {
        cycleStartDate: startDate,
        cycleEndDate: endDate,
      });
      toast({ title: "Thành công", description: "Đã tạo chu kỳ mới!" });
      setStartDate("");
      setEndDate("");
      fetchCycles();
      fetchPrediction();
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

  const filteredCycles = cycles.filter((c) => {
    if (!c.cycleStartDate) return false;
    const start = c.cycleStartDate.slice(0, 10);
    if (filterYear && filterYear !== "all" && !start.startsWith(filterYear))
      return false;
    if (
      filterMonth &&
      filterMonth !== "all" &&
      start.slice(5, 7) !== filterMonth
    )
      return false;
    return true;
  });

  const handleRowClick = (cycle: any) => {
    setSelectedCycle(cycle);
    setShowDetail(true);
    setEditMode(false);
    setEditStart(cycle.cycleStartDate?.slice(0, 10) || "");
    setEditEnd(cycle.cycleEndDate?.slice(0, 10) || "");
    setEditNotes(cycle.notes || ""); // Giả định update có thể có notes
  };

  const handleEdit = async () => {
    if (!selectedCycle) return;
    setEditLoading(true);
    try {
      // Giả định update API có thể nhận notes
      await apiClient.patch(`/menstrual-cycles/${selectedCycle.id}`, {
        cycleStartDate: editStart,
        cycleEndDate: editEnd,
        notes: editNotes,
      });
      toast({ title: "Thành công", description: "Đã cập nhật chu kỳ!" });
      setShowDetail(false);
      fetchCycles();
      fetchPrediction();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể cập nhật",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCycle) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/menstrual-cycles/${selectedCycle.id}`);
      toast({ title: "Thành công", description: "Đã xoá chu kỳ!" });
      setShowDetail(false);
      fetchCycles();
      fetchPrediction();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể xoá",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="container mx-auto p-8 text-center">Đang tải...</div>;
  }

  if (!user || user.gender !== "F") {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Tính năng không có sẵn</h1>
        <p className="mt-2 text-muted-foreground">
          Tính năng này chỉ dành cho người dùng nữ đã đăng nhập.
        </p>
      </div>
    );
  }

  if (user.healthDataConsent !== true) {
    return (
      <div className="container mx-auto flex justify-center items-center p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Yêu cầu quyền thu thập dữ liệu</CardTitle>
            <CardDescription>
              Vui lòng đọc kỹ và xác nhận để tiếp tục.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Để sử dụng tính năng theo dõi chu kỳ kinh nguyệt, chúng tôi cần sự
              cho phép của bạn để thu thập và lưu trữ các dữ liệu sức khỏe nhạy
              cảm, bao gồm ngày bắt đầu/kết thúc chu kỳ.
            </p>
            <p className="font-semibold">
              Chúng tôi cam kết bảo mật thông tin của bạn. Bạn có đồng ý cho
              phép không?
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>
              Từ chối
            </Button>
            <Button onClick={handleConsent} disabled={isConsenting}>
              {isConsenting ? "Đang xử lý..." : "Đồng ý và tiếp tục"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Theo dõi chu kỳ kinh nguyệt</h1>
      {prediction && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Dự đoán kỳ tiếp theo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div>
                <b>Ngày bắt đầu dự đoán:</b>{" "}
                {prediction.predictedCycleStart ||
                  prediction.data?.predictedCycleStart}
              </div>
              <div>
                <b>Ngày kết thúc dự đoán:</b>{" "}
                {prediction.predictedCycleEnd ||
                  prediction.data?.predictedCycleEnd}
              </div>
              <div>
                <b>Ngày rụng trứng dự đoán:</b>{" "}
                {prediction.predictedOvulationDate ||
                  prediction.data?.predictedOvulationDate}
              </div>
              <div>
                <b>Khoảng thụ thai cao:</b>{" "}
                {prediction.predictedFertileStart ||
                  prediction.data?.predictedFertileStart}{" "}
                -{" "}
                {prediction.predictedFertileEnd ||
                  prediction.data?.predictedFertileEnd}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thêm chu kỳ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Ngày bắt đầu</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end-date">Ngày kết thúc</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* Đã xóa input cho 'notes' */}
            <Button type="submit" disabled={creating}>
              {creating ? "Đang lưu..." : "Lưu chu kỳ"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="flex gap-2 mb-4">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm</SelectItem>
            {[
              ...new Set(
                cycles
                  .map((c) => c.cycleStartDate?.slice(0, 4))
                  .filter(Boolean)
              ),
            ].map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tháng</SelectItem>
            {[...Array(12)].map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                Tháng {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử chu kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Đang tải...</div>
          ) : filteredCycles.length === 0 ? (
            <div>Không có dữ liệu phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border text-left">Ngày bắt đầu</th>
                    <th className="p-2 border text-left">Ngày kết thúc</th>
                    <th className="p-2 border text-left">Ghi chú</th>
                    <th className="p-2 border text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCycles.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-2 border align-middle">
                        {c.cycleStartDate?.slice(0, 10)}
                      </td>
                      <td className="p-2 border align-middle">
                        {c.cycleEndDate?.slice(0, 10)}
                      </td>
                      <td className="p-2 border align-middle">{c.notes}</td>
                      <td className="p-2 border text-center align-middle">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRowClick(c)}
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Sửa chu kỳ" : "Chi tiết chu kỳ"}
            </DialogTitle>
          </DialogHeader>
          {selectedCycle && (
            <div>
              {editMode ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEdit();
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ngày bắt đầu</Label>
                      <Input
                        type="date"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Ngày kết thúc</Label>
                      <Input
                        type="date"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Ghi chú</Label>
                    <Input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setEditMode(false)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={editLoading}>
                      {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 rounded-md border p-4">
                    <p>
                      <b>Ngày bắt đầu:</b>{" "}
                      {selectedCycle.cycleStartDate?.slice(0, 10)}
                    </p>
                    <p>
                      <b>Ngày kết thúc:</b>{" "}
                      {selectedCycle.cycleEndDate?.slice(0, 10)}
                    </p>
                    <p>
                      <b>Ghi chú:</b> {selectedCycle.notes || "Không có"}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditMode(true)}>
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? "Đang xoá..." : "Xoá chu kỳ"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}