// Enum cho trạng thái của TestResult
export enum TestStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

// Enum cho loại dịch vụ y tế
export enum ServiceType {
    STI_TEST = 'sti_test',
    BLOOD_TEST = 'blood_test',
    URINE_TEST = 'urine_test',
    IMAGING = 'imaging',
    BIOPSY = 'biopsy',
    GENETIC_TEST = 'genetic_test',
    HORMONE_TEST = 'hormone_test',
    ALLERGY_TEST = 'allergy_test',
    CARDIAC_TEST = 'cardiac_test',
    OTHER = 'other',
}

// Enum cho đơn vị đo lường
export enum MeasurementUnit {
    // Nồng độ
    MG_DL = 'mg/dL',
    G_L = 'g/L',
    MMOL_L = 'mmol/L',
    IU_ML = 'IU/mL',
    NG_ML = 'ng/mL',
    PG_ML = 'pg/mL',

    // Đếm
    CELLS_UL = 'cells/μL',
    MILLION_UL = 'million/μL',
    THOUSAND_UL = 'thousand/μL',

    // Tỷ lệ
    PERCENT = '%',
    RATIO = 'ratio',

    // Định tính
    POSITIVE = 'positive',
    NEGATIVE = 'negative',
    REACTIVE = 'reactive',
    NON_REACTIVE = 'non_reactive',

    // Khác
    NONE = 'none',
}

// Enum cho mức độ bất thường
export enum AbnormalityLevel {
    NORMAL = 'normal',
    SLIGHTLY_ABNORMAL = 'slightly_abnormal',
    MODERATELY_ABNORMAL = 'moderately_abnormal',
    SEVERELY_ABNORMAL = 'severely_abnormal',
    CRITICAL = 'critical',
}
