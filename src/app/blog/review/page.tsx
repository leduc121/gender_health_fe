"use client";
import { useEffect, useState } from "react";
import { Blog, BlogService } from "@/services/blog.service";
import { Button } from "@/components/ui/button";
import { fetchAllUsers } from "@/services/api";
import BlogReviewModal from "@/components/BlogReviewModal";
import BlogPublishModal from "@/components/BlogPublishModal";

export default function BlogReviewPage() {
  const [pendingBlogs, setPendingBlogs] = useState<Blog[]>([]);
  const [approvedBlogs, setApprovedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [selectedBlogToPublish, setSelectedBlogToPublish] = useState<Blog | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
    fetchAllUsers()
      .then((res: any) => {
        // SỬA LỖI TYPESCRIPT: Kiểm tra nếu res là mảng thì dùng luôn
        const usersData = Array.isArray(res)
          ? res
          : res?.data?.data || res?.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      })
      .catch(() => setUsers([]));
  }, []);

  const fetchBlogs = () => {
    setLoading(true);
    Promise.all([BlogService.getPendingReview(), BlogService.getApproved()])
      .then(([pendingResponse, approvedResponse]: [any, any]) => {
        // SỬA LỖI TYPESCRIPT: Kiểm tra nếu response là mảng thì dùng luôn
        const pendingData = Array.isArray(pendingResponse)
          ? pendingResponse
          : pendingResponse?.data?.data || pendingResponse?.data || [];
        setPendingBlogs(Array.isArray(pendingData) ? pendingData : []);

        const approvedData = Array.isArray(approvedResponse)
          ? approvedResponse
          : approvedResponse?.data?.data || approvedResponse?.data || [];
        setApprovedBlogs(Array.isArray(approvedData) ? approvedData : []);
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách blog:", err);
        setPendingBlogs([]);
        setApprovedBlogs([]);
      })
      .finally(() => setLoading(false));
  };

  const handleReview = async (blog: Blog, status: string, reason?: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await BlogService.review(blog.id, {
        status,
        ...(status === "rejected" && { rejectionReason: reason }),
        ...(status === "needs_revision" && { revisionNotes: reason }),
      });
      fetchBlogs();
    } catch (err: any) {
      setError(err?.message || "Lỗi khi duyệt bài viết");
    } finally {
      setActionLoading(false);
      setSelectedBlog(null);
    }
  };

  const handlePublishClick = (blog: Blog) => {
    setSelectedBlogToPublish(blog);
  };

  function getAuthorName(authorId: string) {
    const user = users.find((u) => u.id === authorId);
    if (!user) return authorId;
    return (user.firstName || "") + (user.lastName ? " " + user.lastName : "");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Blog chờ duyệt & đã duyệt</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mt-4 mb-3 text-gray-700">Chờ duyệt ({pendingBlogs.length})</h2>
          {pendingBlogs.length === 0 ? (
            <div className="text-gray-500">Không có blog nào chờ duyệt.</div>
          ) : (
            <div className="grid gap-4">
              {pendingBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="border rounded-lg p-4 shadow-sm bg-white flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-lg text-gray-800">{blog.title}</div>
                    <div className="text-sm text-gray-600">
                      Tác giả: {getAuthorName(blog.authorId)}
                    </div>
                  </div>
                  <div className="mt-3 md:mt-0">
                    <Button onClick={() => setSelectedBlog(blog)}>
                      Xem & Duyệt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-700">
            Đã duyệt - Chờ xuất bản ({approvedBlogs.length})
          </h2>
          {approvedBlogs.length === 0 ? (
            <div className="text-gray-500">Không có blog nào đã được duyệt.</div>
          ) : (
            <div className="grid gap-4">
              {approvedBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className="border rounded-lg p-4 shadow-sm bg-white flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-lg text-gray-800">{blog.title}</div>
                    <div className="text-sm text-gray-600">
                      Tác giả: {getAuthorName(blog.authorId)}
                    </div>
                  </div>
                  <div className="mt-3 md:mt-0">
                    <Button
                        onClick={() => handlePublishClick(blog)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Xuất bản
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">{error}</div>}

      <BlogReviewModal
        blog={selectedBlog}
        onClose={() => setSelectedBlog(null)}
        onReview={handleReview}
        loading={actionLoading}
      />

      <BlogPublishModal
        blog={selectedBlogToPublish}
        onClose={() => setSelectedBlogToPublish(null)}
        onPublishSuccess={fetchBlogs}
      />
    </div>
  );
}