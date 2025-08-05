"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MenstrualService, Prediction } from "@/services/menstrual.service";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertCircle, Calendar, CheckCircle, Clock, Info } from "lucide-react";
import React from "react";

interface MenstrualCycleDetailProps {
  cycleId: string;
}

export const MenstrualCycleDetail: React.FC<MenstrualCycleDetailProps> = ({
  cycleId,
}) => {
  const {
    data: cycleData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["menstrual-cycle", cycleId],
    queryFn: () => MenstrualService.getCycle(cycleId),
    enabled: !!cycleId, // Only run query if cycleId is available
  });

  const cycle = cycleData;

  if (isLoading) {
    return <div className="text-center py-4">Đang tải chi tiết chu kỳ...</div>;
  }

  if (isError) {
    return (
      <div className="text-center py-4 text-red-500">
        Lỗi: {error?.message || "Không thể tải chi tiết chu kỳ."}
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="text-center py-4">Không tìm thấy chi tiết chu kỳ.</div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết chu kỳ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <p>
            <strong>Ngày bắt đầu:</strong>{" "}
            {format(new Date(cycle.cycleStartDate), "dd/MM/yyyy")}
          </p>
          <p>
            <strong>Ngày kết thúc:</strong>{" "}
            {cycle.cycleEndDate
              ? format(new Date(cycle.cycleEndDate), "dd/MM/yyyy")
              : "N/A"}
          </p>
        </div>
        <Separator className="my-4" />
        <h4 className="text-lg font-semibold mb-2">Thông tin bổ sung</h4>
        <p className="text-sm text-gray-500">
          (Các thông tin khác như triệu chứng, dự đoán, v.v. sẽ được hiển thị ở
          đây nếu có.)
        </p>
      </CardContent>
    </Card>
  );
};

interface MenstrualPredictionProps {
  prediction?: Prediction;
  isLoading?: boolean;
}

export function MenstrualPrediction({
  prediction,
  isLoading,
}: MenstrualPredictionProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dự đoán chu kỳ tiếp theo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dự đoán chu kỳ tiếp theo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>Chưa có dữ liệu dự đoán</p>
            <p className="text-sm">
              Hãy thêm ít nhất 3 chu kỳ để có dự đoán chính xác
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract data with optional chaining
  const predictionData = prediction?.data || prediction;

  const predictedCycleStart = predictionData?.predictedCycleStart;
  const predictedCycleEnd = predictionData?.predictedCycleEnd;
  const predictedOvulationDate = predictionData?.predictedOvulationDate;
  const predictedFertileStart = predictionData?.predictedFertileStart;
  const predictedFertileEnd = predictionData?.predictedFertileEnd;
  const predictionAccuracy = predictionData?.predictionAccuracy;
  const notificationSent = predictionData?.notificationSent;

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có dữ liệu";
    try {
      return format(parseISO(dateString), "EEEE, dd/MM/yyyy", { locale: vi });
    } catch {
      return "Ngày không hợp lệ";
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (dateString?: string) => {
    if (!dateString) return null;

    try {
      const date = parseISO(dateString);
      const today = new Date();

      if (isToday(date)) {
        return (
          <Badge variant="default" className="bg-green-500">
            Hôm nay
          </Badge>
        );
      } else if (isAfter(date, today)) {
        return <Badge variant="secondary">Sắp tới</Badge>;
      } else if (isBefore(date, today)) {
        return <Badge variant="outline">Đã qua</Badge>;
      }
    } catch {
      return null;
    }

    return null;
  };

  // Helper function to get accuracy color
  const getAccuracyColor = (accuracy?: number | null) => {
    if (!accuracy) return "text-muted-foreground";
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Dự đoán chu kỳ tiếp theo
          {notificationSent && (
            <span title="Đã gửi thông báo">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chu kỳ kinh nguyệt */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Chu kỳ kinh nguyệt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bắt đầu:</span>
                {getStatusBadge(predictedCycleStart)}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(predictedCycleStart)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kết thúc:</span>
                {getStatusBadge(predictedCycleEnd)}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(predictedCycleEnd)}
              </p>
            </div>
          </div>
        </div>

        {/* Thời kỳ rụng trứng */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Thời kỳ rụng trứng
          </h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ngày rụng trứng:</span>
                {getStatusBadge(predictedOvulationDate)}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(predictedOvulationDate)}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bắt đầu thụ thai:</span>
                  {getStatusBadge(predictedFertileStart)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(predictedFertileStart)}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Kết thúc thụ thai:
                  </span>
                  {getStatusBadge(predictedFertileEnd)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(predictedFertileEnd)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Độ chính xác */}
        {predictionAccuracy !== null && predictionAccuracy !== undefined && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Độ chính xác</h3>
            <div className="flex items-center gap-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    predictionAccuracy >= 80
                      ? "bg-green-500"
                      : predictionAccuracy >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${predictionAccuracy}%` }}
                ></div>
              </div>
              <span
                className={`text-sm font-medium ${getAccuracyColor(predictionAccuracy)}`}
              >
                {predictionAccuracy}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Độ chính xác dựa trên dữ liệu chu kỳ trước đó
            </p>
          </div>
        )}

        {/* Thông tin bổ sung */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Cập nhật:{" "}
              {predictionData?.updatedAt
                ? formatDate(predictionData.updatedAt)
                : "Không có"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
