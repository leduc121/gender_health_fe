"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/services/api";
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

export default function MenstrualTrackerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  // Triệu chứng & mood
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [moods, setMoods] = useState<any[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [symptomNotes, setSymptomNotes] = useState("");
  const [moodNotes, setMoodNotes] = useState("");
  const [symptomIntensity, setSymptomIntensity] = useState(3);
  const [moodIntensity, setMoodIntensity] = useState(3);
  const [savingSymptom, setSavingSymptom] = useState(false);
  const [savingMood, setSavingMood] = useState(false);
  const [cycleSymptoms, setCycleSymptoms] = useState<any[]>([]);
  const [cycleMoods, setCycleMoods] = useState<any[]>([]);

  // Lấy lịch sử chu kỳ
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

  // Lấy dự đoán kỳ tiếp theo
  const fetchPrediction = async () => {
    try {
      const res = await apiClient.get("/menstrual-predictions/me");
      setPrediction((res as any).data || res);
    } catch {
      setPrediction(null);
    }
  };

  // Lấy danh sách triệu chứng & mood
  const fetchSymptomsAndMoods = async () => {
    try {
      const [symRes, moodRes] = await Promise.all([
        apiClient.get("/symptoms"),
        apiClient.get("/moods"),
      ]);
      setSymptoms((symRes as any).data || symRes);
      setMoods((moodRes as any).data || moodRes);
    } catch {
      setSymptoms([]);
      setMoods([]);
    }
  };

  // Lấy triệu chứng & mood của chu kỳ đang chọn
  const fetchCycleSymptomsAndMoods = async (cycleId: string) => {
    try {
      const [symRes, moodRes] = await Promise.all([
        apiClient.get(`/cycle-symptoms?cycleId=${cycleId}`),
        apiClient.get(`/cycle-moods?cycleId=${cycleId}`),
      ]);
      setCycleSymptoms((symRes as any).data || symRes);
      setCycleMoods((moodRes as any).data || moodRes);
    } catch {
      setCycleSymptoms([]);
      setCycleMoods([]);
    }
  };

  useEffect(() => {
    fetchCycles();
    fetchPrediction();
    fetchSymptomsAndMoods();
  }, []);

  // Tạo mới chu kỳ
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
      await apiClient.post("/menstrual-cycles", {
        cycleStartDate: startDate,
        cycleEndDate: endDate,
        notes,
      });
      toast({ title: "Thành công", description: "Đã tạo chu kỳ mới!" });
      setStartDate("");
      setEndDate("");
      setNotes("");
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

  // Filter cycles
  const filteredCycles = cycles.filter((c) => {
    const start = c.cycleStartDate?.slice(0, 10);
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

  // Xem chi tiết
  const handleRowClick = (cycle: any) => {
    setSelectedCycle(cycle);
    setShowDetail(true);
    setEditMode(false);
    setEditStart(cycle.cycleStartDate?.slice(0, 10) || "");
    setEditEnd(cycle.cycleEndDate?.slice(0, 10) || "");
    setEditNotes(cycle.notes || "");
    fetchCycleSymptomsAndMoods(cycle.id);
  };

  // Sửa chu kỳ
  const handleEdit = async () => {
    if (!selectedCycle) return;
    setEditLoading(true);
    try {
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

  // Xoá chu kỳ
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

  // Lưu triệu chứng cho chu kỳ
  const handleSaveSymptom = async () => {
    if (!selectedCycle || !selectedSymptom) return;
    setSavingSymptom(true);
    try {
      await apiClient.post("/cycle-symptoms", {
        cycleId: selectedCycle.id,
        symptomId: selectedSymptom,
        intensity: symptomIntensity,
        notes: symptomNotes,
      });
      toast({ title: "Thành công", description: "Đã lưu triệu chứng!" });
      setSelectedSymptom("");
      setSymptomNotes("");
      setSymptomIntensity(3);
      fetchCycleSymptomsAndMoods(selectedCycle.id);
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể lưu triệu chứng",
        variant: "destructive",
      });
    } finally {
      setSavingSymptom(false);
    }
  };

  // Lưu mood cho chu kỳ
  const handleSaveMood = async () => {
    if (!selectedCycle || !selectedMood) return;
    setSavingMood(true);
    try {
      await apiClient.post("/cycle-moods", {
        cycleId: selectedCycle.id,
        moodId: selectedMood,
        intensity: moodIntensity,
        notes: moodNotes,
      });
      toast({ title: "Thành công", description: "Đã lưu tâm trạng!" });
      setSelectedMood("");
      setMoodNotes("");
      setMoodIntensity(3);
      fetchCycleSymptomsAndMoods(selectedCycle.id);
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể lưu tâm trạng",
        variant: "destructive",
      });
    } finally {
      setSavingMood(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Theo dõi chu kỳ kinh nguyệt</h1>
      {/* Block dự đoán */}
      {prediction && (
        <Card className="mb-6">
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
      {/* Form tạo mới */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thêm chu kỳ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày kết thúc</label>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Ghi chú</label>
              <textarea
                className="border rounded px-2 py-1 w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Đang lưu..." : "Lưu chu kỳ"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {[
              ...Array.from(
                new Set(
                  cycles
                    .map((c) => c.cycleStartDate?.slice(0, 4))
                    .filter(Boolean)
                )
              ),
            ].map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Tháng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {[...Array(12)].map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Danh sách lịch sử chu kỳ */}
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
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-center">Ngày bắt đầu</th>
                  <th className="p-2 border text-center">Ngày kết thúc</th>
                  <th className="p-2 border text-center">Ghi chú</th>
                  <th className="p-2 border text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCycles.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedCycle?.id === c.id ? "bg-blue-50" : ""}`}
                    onClick={() => handleRowClick(c)}
                  >
                    <td className="p-2 border text-center align-middle">
                      {c.cycleStartDate?.slice(0, 10)}
                    </td>
                    <td className="p-2 border text-center align-middle">
                      {c.cycleEndDate?.slice(0, 10)}
                    </td>
                    <td className="p-2 border text-center align-middle">
                      {c.notes}
                    </td>
                    <td className="p-2 border text-center align-middle">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCycle(c);
                          setShowDetail(true);
                          setEditMode(true);
                          fetchCycleSymptomsAndMoods(c.id);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCycle(c);
                          setShowDetail(true);
                          setEditMode(false);
                          fetchCycleSymptomsAndMoods(c.id);
                        }}
                      >
                        Xoá
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {/* Block triệu chứng/tâm trạng cho chu kỳ đã chọn */}
      {selectedCycle && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Ghi chú triệu chứng & tâm trạng cho chu kỳ:{" "}
              {selectedCycle.cycleStartDate?.slice(0, 10)} -{" "}
              {selectedCycle.cycleEndDate?.slice(0, 10)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Ghi chú triệu chứng</h4>
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 border">
                <div className="flex flex-wrap gap-4 items-end justify-center">
                  <div className="flex flex-col w-48">
                    <label className="text-xs text-gray-500 mb-1">
                      Triệu chứng
                    </label>
                    <Select
                      value={selectedSymptom}
                      onValueChange={setSelectedSymptom}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn triệu chứng" />
                      </SelectTrigger>
                      <SelectContent>
                        {symptoms.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col w-24">
                    <label className="text-xs text-gray-500 mb-1">
                      Mức độ (1-5)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={symptomIntensity}
                      onChange={(e) =>
                        setSymptomIntensity(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col w-56">
                    <label className="text-xs text-gray-500 mb-1">
                      Ghi chú
                    </label>
                    <Input
                      value={symptomNotes}
                      onChange={(e) => setSymptomNotes(e.target.value)}
                      placeholder="Ghi chú"
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleSaveSymptom}
                    disabled={savingSymptom || !selectedSymptom}
                    className="bg-primary text-white font-semibold rounded-full h-10 px-6 mt-5"
                  >
                    {savingSymptom ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </div>
              {/* Danh sách triệu chứng đã ghi */}
              <ul className="list-disc pl-5 text-sm mt-2">
                {cycleSymptoms.map((s) => (
                  <li key={s.id}>
                    <b>
                      {symptoms.find((sym) => sym.id === s.symptomId)?.name ||
                        s.symptomId}
                    </b>
                    {" - "}Mức độ: {s.intensity} {s.notes && `- ${s.notes}`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-2">
              <h4 className="font-semibold mb-3">Ghi chú tâm trạng</h4>
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 border">
                <div className="flex flex-wrap gap-4 items-end justify-center">
                  <div className="flex flex-col w-48">
                    <label className="text-xs text-gray-500 mb-1">
                      Tâm trạng
                    </label>
                    <Select
                      value={selectedMood}
                      onValueChange={setSelectedMood}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn tâm trạng" />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col w-24">
                    <label className="text-xs text-gray-500 mb-1">
                      Mức độ (1-5)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={moodIntensity}
                      onChange={(e) => setMoodIntensity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col w-56">
                    <label className="text-xs text-gray-500 mb-1">
                      Ghi chú
                    </label>
                    <Input
                      value={moodNotes}
                      onChange={(e) => setMoodNotes(e.target.value)}
                      placeholder="Ghi chú"
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleSaveMood}
                    disabled={savingMood || !selectedMood}
                    className="bg-primary text-white font-semibold rounded-full h-10 px-6 mt-5"
                  >
                    {savingMood ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </div>
              {/* Danh sách mood đã ghi */}
              <ul className="list-disc pl-5 text-sm mt-2">
                {cycleMoods.map((m) => (
                  <li key={m.id}>
                    <b>
                      {moods.find((md) => md.id === m.moodId)?.name || m.moodId}
                    </b>
                    {" - "}Mức độ: {m.intensity} {m.notes && `- ${m.notes}`}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Modal chi tiết/sửa/xoá */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Sửa chu kỳ" : "Chi tiết chu kỳ"}
            </DialogTitle>
          </DialogHeader>
          {selectedCycle && (
            <div className="space-y-3">
              <div>
                <b>Ngày bắt đầu:</b>{" "}
                {selectedCycle.cycleStartDate?.slice(0, 10)}
              </div>
              <div>
                <b>Ngày kết thúc:</b> {selectedCycle.cycleEndDate?.slice(0, 10)}
              </div>
              <div>
                <b>Ghi chú:</b> {selectedCycle.notes}
              </div>
              {editMode && (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEdit();
                  }}
                >
                  <Input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    required
                  />
                  <Input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    required
                  />
                  <Input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={editLoading}>
                      {editLoading ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
              {!editMode && (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Đang xoá..." : "Xoá chu kỳ"}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
