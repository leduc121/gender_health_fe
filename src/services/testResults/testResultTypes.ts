import { AppointmentEntity } from "../appointments/appointmentTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { StiTestProcessEntity } from "../stiTestProcesses/stiTestProcesseTypes";
import { UserEntity } from "../users/userTypes";
import {
  AbnormalityLevel,
  MeasurementUnit,
  ServiceType,
} from "./enums/test-result.enums";

export interface TestResultEntity {
  id: string;
  resultData: TestResultData;
  resultSummary?: string;
  isAbnormal: boolean;
  recommendation?: string;
  notificationSent: boolean;
  followUpRequired: boolean;
  followUpNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  documents: Document[];
  appointment: AppointmentEntity;
  service: ServiceEntity;
  user: UserEntity;
  stiTestProcess: StiTestProcessEntity;
}

// Interface cho một kết quả test riêng lẻ
export interface TestResultItem {
  // Thông tin cơ bản
  parameterName: string; // Tên chỉ số (VD: "HIV", "Glucose", "Hemoglobin")
  displayName: string; // Tên hiển thị (VD: "HIV Antibody", "Đường huyết", "Huyết sắc tố")
  category?: string; // Nhóm (VD: "STI", "Blood Chemistry", "Hematology")

  // Giá trị kết quả
  value: string | number; // Giá trị thực tế
  unit: MeasurementUnit; // Đơn vị đo

  // Tham chiếu bình thường
  referenceRange?: {
    min?: number;
    max?: number;
    normalValues?: string[]; // Cho giá trị định tính như "Negative", "Normal"
    description?: string; // Mô tả tham chiếu
  };

  // Đánh giá kết quả
  status: "normal" | "abnormal" | "borderline" | "critical";
  abnormalityLevel?: AbnormalityLevel;

  // Ghi chú
  notes?: string; // Ghi chú từ máy/lab
  clinicalSignificance?: string; // Ý nghĩa lâm sàng

  // Metadata
  methodUsed?: string; // Phương pháp xét nghiệm
  equipmentUsed?: string; // Thiết bị sử dụng
  labTechnician?: string; // Kỹ thuật viên thực hiện
}

// Interface chính cho dữ liệu kết quả xét nghiệm
export interface TestResultData {
  // Metadata chung
  serviceType: ServiceType; // Loại dịch vụ y tế
  testName: string; // Tên xét nghiệm (VD: "Bộ xét nghiệm STI cơ bản")
  testCode?: string; // Mã xét nghiệm nội bộ

  // Thời gian thực hiện
  sampleCollectedAt?: Date | string; // Thời gian lấy mẫu
  analyzedAt?: Date | string; // Thời gian phân tích
  reportedAt?: Date | string; // Thời gian báo cáo

  // Thông tin mẫu
  sampleInfo?: {
    type: string; // Loại mẫu (máu, nước tiểu, etc.)
    condition: string; // Tình trạng mẫu
    volume?: string; // Thể tích mẫu
    collectionMethod?: string; // Phương pháp lấy mẫu
  };

  // Kết quả chi tiết
  results: TestResultItem[]; // Danh sách các kết quả

  // Tổng quan
  overallStatus: "normal" | "abnormal" | "inconclusive" | "critical";
  summary?: string; // Tóm tắt tổng quát

  // Đánh giá lâm sàng
  clinicalInterpretation?: string; // Giải thích lâm sàng
  recommendations?: string[]; // Khuyến nghị

  // Thông tin lab
  laboratoryInfo?: {
    name: string; // Tên phòng lab
    address?: string; // Địa chỉ
    accreditation?: string; // Chứng nhận
    contactInfo?: string; // Thông tin liên hệ
  };

  // Validation và QC
  qualityControl?: {
    passed: boolean; // QC có pass không
    issues?: string[]; // Các vấn đề QC
    reviewer?: string; // Người review
  };
}
