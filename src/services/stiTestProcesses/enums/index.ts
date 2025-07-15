// Enum cho trạng thái của quá trình xét nghiệm STI
export enum StiTestProcessStatus {
    ORDERED = 'ordered', // Đã đặt xét nghiệm
    SAMPLE_COLLECTION_SCHEDULED = 'sample_collection_scheduled', // Đã lên lịch lấy mẫu
    SAMPLE_COLLECTED = 'sample_collected', // Đã lấy mẫu
    PROCESSING = 'processing', // Đang xử lý/phân tích
    RESULT_READY = 'result_ready', // Kết quả đã sẵn sàng
    RESULT_DELIVERED = 'result_delivered', // Đã giao kết quả
    CONSULTATION_REQUIRED = 'consultation_required', // Cần tư vấn thêm
    FOLLOW_UP_SCHEDULED = 'follow_up_scheduled', // Đã lên lịch theo dõi
    COMPLETED = 'completed', // Hoàn thành
    CANCELLED = 'cancelled', // Đã hủy
}

// Enum cho loại mẫu xét nghiệm
export enum StiSampleType {
    BLOOD = 'blood', // Mẫu máu
    URINE = 'urine', // Mẫu nước tiểu
    SWAB = 'swab', // Mẫu lấy từ niêm mạc (ví dụ: âm đạo, dương vật)
    SALIVA = 'saliva', // Mẫu nước bọt
    OTHER = 'other', // Loại mẫu khác (cần mô tả cụ thể)
}

// Enum cho độ ưu tiên
export enum ProcessPriority {
    NORMAL = 'normal', // Mức độ ưu tiên bình thường
    HIGH = 'high', // Mức độ ưu tiên cao
    URGENT = 'urgent', // Mức độ ưu tiên khẩn cấp
}

export enum DeliveryMethod {
    IN_PERSON = 'in_person', // Giao trực tiếp
    EMAIL = 'email', // Gửi qua email
    PORTAL = 'portal', // Gửi qua cổng thông tin bệnh nhân
}

export enum UrgencyLevel {
    NORMAL = 'normal', // Mức độ ưu tiên bình thường
    HIGH = 'high', // Mức độ ưu tiên cao
    URGENT = 'urgent', // Mức độ ưu tiên khẩn cấp
}

export enum FollowUpType {
    TREATMENT = 'treatment', // Theo dõi điều trị
    MONITORING = 'monitoring', // Theo dõi sức khỏe
    RETEST = 'retest', // Theo dõi xét nghiệm lại
}
