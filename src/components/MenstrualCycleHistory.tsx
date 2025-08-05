"use client";

import { MenstrualCycleDetail } from "@/components/MenstrualCycleDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { CycleData, MenstrualService } from "@/services/menstrual.service";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Eye, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface MenstrualCycleHistoryProps {
  cycles: CycleData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const MenstrualCycleHistory: React.FC<MenstrualCycleHistoryProps> = ({
  cycles,
  isLoading,
  isError,
  error,
}) => {
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleData | null>(null);
  const [deleteCycleId, setDeleteCycleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    cycleStartDate: "",
    cycleEndDate: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("MenstrualCycleHistory received cycles:", cycles);

  const handleBackToList = () => {
    setSelectedCycleId(null);
  };

  const handleEdit = (cycle: CycleData) => {
    setEditingCycle(cycle);
    setEditForm({
      cycleStartDate: format(new Date(cycle.cycleStartDate), "yyyy-MM-dd"),
      cycleEndDate: cycle.cycleEndDate
        ? format(new Date(cycle.cycleEndDate), "yyyy-MM-dd")
        : "",
      notes: cycle.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (cycleId: string) => {
    setDeleteCycleId(cycleId);
    setShowDeleteDialog(true);
  };

  const handleView = (cycleId: string) => {
    setSelectedCycleId(cycleId);
  };

  // Update mutation
  const { mutate: updateCycle, isPending: isUpdating } = useMutation({
    mutationFn: (data: { id: string; cycleData: Partial<CycleData> }) =>
      MenstrualService.updateCycle(data.id, data.cycleData),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật chu kỳ!" });
      setShowEditDialog(false);
      setEditingCycle(null);
      queryClient.refetchQueries({ queryKey: ["menstrual-cycles"] });
      queryClient.refetchQueries({ queryKey: ["predictions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể cập nhật chu kỳ",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const { mutate: deleteCycle, isPending: isDeleting } = useMutation({
    mutationFn: (cycleId: string) => MenstrualService.deleteCycle(cycleId),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa chu kỳ!" });
      setShowDeleteDialog(false);
      setDeleteCycleId(null);
      queryClient.refetchQueries({ queryKey: ["menstrual-cycles"] });
      queryClient.refetchQueries({ queryKey: ["predictions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể xóa chu kỳ",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCycle) return;

    const cycleData: Partial<CycleData> = {
      cycleStartDate: new Date(editForm.cycleStartDate),
      cycleEndDate: editForm.cycleEndDate
        ? new Date(editForm.cycleEndDate)
        : undefined,
      notes: editForm.notes || undefined,
    };

    updateCycle({ id: editingCycle.id, cycleData });
  };

  const handleDeleteConfirm = () => {
    if (deleteCycleId) {
      deleteCycle(deleteCycleId);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Đang tải lịch sử chu kỳ...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-red-500">
        Lỗi: {error?.message || "Không thể tải lịch sử chu kỳ."}
      </div>
    );
  }

  if (selectedCycleId) {
    return (
      <div>
        <Button onClick={handleBackToList} className="mb-4">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
        <MenstrualCycleDetail cycleId={selectedCycleId} />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử chu kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <p>Không có dữ liệu lịch sử chu kỳ nào.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle: any) => (
                  <TableRow key={cycle.id}>
                    <TableCell>
                      {format(new Date(cycle.cycleStartDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {cycle.cycleEndDate
                        ? format(new Date(cycle.cycleEndDate), "dd/MM/yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(cycle.id)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cycle)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(cycle.id)}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chu kỳ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cycleStartDate">Ngày bắt đầu</Label>
              <Input
                id="cycleStartDate"
                type="date"
                value={editForm.cycleStartDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, cycleStartDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="cycleEndDate">
                Ngày kết thúc (Không bắt buộc)
              </Label>
              <Input
                id="cycleEndDate"
                type="date"
                value={editForm.cycleEndDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, cycleEndDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Input
                id="notes"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                placeholder="Ghi chú về chu kỳ..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isUpdating}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa chu kỳ này không?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
