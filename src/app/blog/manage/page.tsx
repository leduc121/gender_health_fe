"use client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Blog, BlogService } from "@/services/blog.service";
import { fetchAllUsers } from "@/services/api";
import BlogCreateWithImage from "@/components/BlogCreateWithImage";
import EditBlogModal from "@/components/EditBlogModal";
import BlogReasonModal from "@/components/BlogReasonModal";
import { useRouter } from "next/navigation";

export default function BlogManagePage() {
  const { user } = useAuth();
  let roleName = "";
  if (user?.role && typeof user.role === "object" && typeof user.role.name === "string") {
    roleName = user.role.name.toLowerCase();
  }
  const canCreate = ["admin", "manager", "consultant"].includes(roleName);
  const isAdminOrManager = ["admin", "manager"].includes(roleName);

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedBlogReason, setSelectedBlogReason] = useState({
    rejectionReason: "",
    revisionNotes: "",
  });
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!canCreate) return;
    setLoading(true);
    BlogService.getAll()
      .then((data: any) => {
        if (Array.isArray(data)) {
          setBlogs(data);
        } else if (Array.isArray(data?.data)) {
          setBlogs(data.data);
        } else {
          setBlogs([]);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi lấy danh sách blog:", error);
        setBlogs([]);
      })
      .finally(() => setLoading(false));
    fetchAllUsers()
      .then((res) => {
        if (Array.isArray(res?.data)) setUsers(res.data);
        else if (Array.isArray(res)) setUsers(res);
        else setUsers([]);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
        setUsers([]);
      });
  }, [canCreate]);

  function getAuthorName(authorId: string) {
    const user = users.find((u) => u.id === authorId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : authorId;
  }

  const handleOpenReasonModal = (blog: Blog) => {
    setSelectedBlogReason({
      rejectionReason: blog.rejectionReason || "",
      revisionNotes: blog.revisionNotes || "",
    });
    setReasonModalOpen(true);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá blog này?")) return;
    try {
      await BlogService.delete(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err?.message || "Xoá blog thất bại");
    }
  };

  const handleReviewClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setSelectedBlogReason({
      rejectionReason: blog.rejectionReason || "",
      revisionNotes: blog.revisionNotes || "",
    });
    setShowReviewDialog(true);
  };

  const handlePublishClick = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xuất bản blog này?")) return;
    try {
      await BlogService.publish(id);
      setBlogs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "published" } : b))
      );
    } catch (err: any) {
      alert(err?.message || "Xuất bản thất bại");
    }
  };

  const handleReviewSubmit = async (status: string, reason?: string) => {
    if (!selectedBlog) return;
    try {
      await BlogService.review(selectedBlog.id, {
        status,
        ...(status === "REJECTED" && { rejectionReason: reason }),
        ...(status === "NEEDS_REVISION" && { revisionNotes: reason }),
      });
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === selectedBlog.id
            ? {
                ...b,
                status,
                rejectionReason: status === "REJECTED" ? reason : "",
                revisionNotes: status === "NEEDS_REVISION" ? reason : "",
              }
            : b
        )
      );
      setShowReviewDialog(false);
      setSelectedBlogReason({ rejectionReason: "", revisionNotes: "" });
    } catch (err: any) {
      alert(err?.message || "Duyệt thất bại");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Blog</h1>
        {canCreate && (
          <div className="flex gap-2">
            <Link href="/blog/new">
              <Button>Tạo blog mới</Button>
            </Link>
            <Link href="/blog/review">
              <Button variant="outline">Review Blog</Button>
            </Link>
            <Link href="/blog/categories">
              <Button variant="outline">Quản lý chủ đề</Button>
            </Link>
          </div>
        )}
      </div>
      {canCreate &&
        (loading ? (
          <div>Đang tải...</div>
        ) : blogs.length === 0 ? (
          <div>Không có blog nào.</div>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Tiêu đề</th>
                  <th className="p-2 border text-center">Chủ đề</th>
                  <th className="p-2 border text-center">Tác giả</th>
                  <th className="p-2 border text-center">Trạng thái</th>
                  <th className="p-2 border text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="p-2 border font-medium">{blog.title}</td>
                    <td className="p-2 border text-center">
                      {blog.category?.name || ""}
                    </td>
                    <td className="p-2 border text-center">
                      {getAuthorName(blog.authorId)}
                    </td>
                    <td className="p-2 border text-center">{blog.status}</td>
                    <td className="p-2 border text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowImageModal(blog.id)}
                        >
                          Cập nhật ảnh
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditBlog(blog)}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBlog(blog.id)}
                          disabled={!isAdminOrManager}
                        >
                          Xoá
                        </Button>
                        {isAdminOrManager && blog.status === "pending_review" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewClick(blog)}
                          >
                            Duyệt
                          </Button>
                        )}
                        {isAdminOrManager && blog.status === "approved" && (
                          <Button
                            size="sm"
                            variant="default" // Thay "success" bằng "default"
                            className="bg-green-500 text-white hover:bg-green-600" // Thêm class CSS để mô phỏng màu success
                            onClick={() => handlePublishClick(blog.id)}
                          >
                            Xuất bản
                          </Button>
                        )}
                        {(blog.rejectionReason || blog.revisionNotes) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReasonModal(blog)}
                          >
                            Xem lý do
                          </Button>
                        )}
                      </div>
                      {showImageModal === blog.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
                            <button
                              className="absolute top-2 right-2 text-xl"
                              onClick={() => setShowImageModal(null)}
                            >
                              ×
                            </button>
                            <h3 className="text-lg font-bold mb-4">
                              Cập nhật ảnh cho blog
                            </h3>
                            <BlogCreateWithImage blogId={blog.id} />
                          </div>
                        </div>
                      )}
                      {editBlog?.id === blog.id && (
                        <EditBlogModal
                          blog={editBlog}
                          onClose={() => setEditBlog(null)}
                          onSuccess={() => {
                            setEditBlog(null);
                            BlogService.getAll().then((data: any) => {
                              if (Array.isArray(data)) setBlogs(data);
                              else if (Array.isArray(data?.data))
                                setBlogs(data.data);
                            });
                          }}
                        />
                      )}
                      {showReviewDialog && selectedBlog?.id === blog.id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Duyệt bài viết</h3>
                            <div className="mb-4">
                              <label className="block mb-2">Trạng thái:</label>
                              <select
                                className="w-full border rounded p-2"
                                value={
                                  selectedBlogReason.rejectionReason
                                    ? "REJECTED"
                                    : selectedBlogReason.revisionNotes
                                    ? "NEEDS_REVISION"
                                    : ""
                                }
                                onChange={(e) => {
                                  const status = e.target.value;
                                  setSelectedBlogReason({
                                    rejectionReason: status === "REJECTED" ? "" : selectedBlogReason.rejectionReason,
                                    revisionNotes: status === "NEEDS_REVISION" ? "" : selectedBlogReason.revisionNotes,
                                  });
                                }}
                              >
                                <option value="">Chọn trạng thái</option>
                                <option value="APPROVED">Duyệt</option>
                                <option value="REJECTED">Từ chối</option>
                                <option value="NEEDS_REVISION">Yêu cầu sửa</option>
                              </select>
                            </div>
                            {(selectedBlogReason.rejectionReason || selectedBlogReason.revisionNotes) && (
                              <div className="mb-4">
                                <label className="block mb-2">Lý do:</label>
                                <textarea
                                  className="w-full border rounded p-2"
                                  value={selectedBlogReason.rejectionReason || selectedBlogReason.revisionNotes || ""}
                                  onChange={(e) =>
                                    setSelectedBlogReason({
                                      ...selectedBlogReason,
                                      rejectionReason: selectedBlogReason.rejectionReason ? e.target.value : "",
                                      revisionNotes: selectedBlogReason.revisionNotes ? e.target.value : "",
                                    })
                                  }
                                  placeholder="Nhập lý do hoặc ghi chú..."
                                />
                              </div>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setShowReviewDialog(false)}
                              >
                                Hủy
                              </Button>
                              <Button
                                onClick={() => {
                                  const status =
                                    selectedBlogReason.rejectionReason
                                      ? "REJECTED"
                                      : selectedBlogReason.revisionNotes
                                      ? "NEEDS_REVISION"
                                      : "APPROVED";
                                  handleReviewSubmit(status, selectedBlogReason.rejectionReason || selectedBlogReason.revisionNotes);
                                }}
                                disabled={
                                  !selectedBlogReason.rejectionReason &&
                                  !selectedBlogReason.revisionNotes &&
                                  selectedBlogReason.rejectionReason !== "" &&
                                  selectedBlogReason.revisionNotes !== ""
                                }
                              >
                                Xác nhận
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      <BlogReasonModal
        open={reasonModalOpen}
        onClose={() => setReasonModalOpen(false)}
        rejectionReason={selectedBlogReason.rejectionReason || ""}
        revisionNotes={selectedBlogReason.revisionNotes || ""}
      />
    </div>
  );
}