"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Blog } from "@/services/blog.service";

/**
 * Định nghĩa props cho BlogReviewModal.
 * @param {Blog | null} blog - Đối tượng blog cần review.
 * @param {() => void} onClose - Hàm để đóng modal.
 * @param {(blog: Blog, status: string, reason?: string) => void} onReview - Hàm callback để xử lý logic review từ component cha.
 * @param {boolean} loading - Trạng thái loading để vô hiệu hóa các nút khi đang xử lý.
 */
export interface BlogReviewModalProps {
  blog: Blog | null;
  onClose: () => void;
  onReview: (blog: Blog, status: string, reason?: string) => void;
  loading: boolean;
}

export default function BlogReviewModal({
  blog,
  onClose,
  onReview,
  loading,
}: BlogReviewModalProps) {
  const [reviewStatus, setReviewStatus] = useState<string>("approved");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Reset lại trạng thái của modal mỗi khi một blog mới được chọn
  useEffect(() => {
    if (blog) {
      setReviewStatus("approved");
      setReason("");
      setError("");
    }
  }, [blog]);

  // Xử lý khi người dùng nhấn nút "Xác nhận"
  const handleSubmit = () => {
    if (!blog) return;

    // Kiểm tra nếu trạng thái không phải là 'approved' thì phải có lý do
    if (reviewStatus !== "approved" && !reason.trim()) {
      setError("Vui lòng nhập lý do hoặc ghi chú.");
      return;
    }
    setError("");
    // Gọi hàm onReview đã được truyền từ component cha
    onReview(blog, reviewStatus, reason);
  };

  if (!blog) return null;

  // Lấy nhãn cho ô nhập lý do tùy theo trạng thái
  const getReasonLabel = () => {
    if (reviewStatus === "rejected") {
      return "Lý do từ chối (rejectionReason)";
    }
    if (reviewStatus === "needs_revision") {
      return "Ghi chú yêu cầu sửa (revisionNotes)";
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl relative m-4">
        <button
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800"
          onClick={onClose}
          aria-label="Đóng"
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Duyệt bài viết: {blog.title}
        </h2>
        
        {/* Hiển thị nội dung blog */}
        <div className="mb-4">
            <p className="font-semibold text-gray-700">Nội dung:</p>
            <div
                className="prose max-w-none max-h-60 overflow-y-auto p-3 border rounded-md bg-gray-50 mt-1"
                dangerouslySetInnerHTML={{ __html: blog.content }}
            />
        </div>

        {/* Lựa chọn trạng thái review */}
        <div className="mb-4">
          <label htmlFor="reviewStatus" className="font-medium block mb-1 text-gray-700">
            Hành động
          </label>
          <select
            id="reviewStatus"
            className="w-full border rounded px-3 py-2 mt-1 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={reviewStatus}
            onChange={(e) => {
              setReviewStatus(e.target.value);
              setError(""); // Xóa lỗi khi thay đổi
            }}
          >
            <option value="approved">Duyệt (Approved)</option>
            <option value="rejected">Từ chối (Rejected)</option>
            <option value="needs_revision">Yêu cầu sửa (Needs Revision)</option>
          </select>
        </div>

        {/* Ô nhập lý do (chỉ hiện khi cần) */}
        {reviewStatus !== "approved" && (
          <div className="mb-4">
            <label htmlFor="reason" className="font-medium text-gray-700">
              {getReasonLabel()}
            </label>
            <textarea
              id="reason"
              className="w-full border rounded px-3 py-2 mt-1 min-h-[100px] shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hoặc ghi chú..."
            />
          </div>
        )}

        {/* Hiển thị lỗi */}
        {error && <div className="text-red-600 mb-4 font-medium">{error}</div>}

        {/* Các nút hành động */}
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </div>
      </div>
    </div>
  );
}