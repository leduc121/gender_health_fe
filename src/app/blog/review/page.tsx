"use client";

import { useEffect, useState } from "react";
import { Blog, BlogService } from "@/services/blog.service";
import { Button } from "@/components/ui/button";
import { fetchAllUsers } from "@/services/api";
import BlogReviewModal from "@/components/BlogReviewModal";
import BlogPublishModal from "@/components/BlogPublishModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function BlogReviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  let roleName = "";
  if (
    user?.role &&
    typeof user.role === "object" &&
    typeof user.role.name === "string"
  ) {
    roleName = user.role.name.toLowerCase();
  }
  const isAdminOrManager = ["admin", "manager"].includes(roleName);

  const [pendingBlogs, setPendingBlogs] = useState<Blog[]>([]);
  const [approvedBlogs, setApprovedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [selectedBlogToPublish, setSelectedBlogToPublish] = useState<Blog | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminOrManager) {
      router.push("/");
      return;
    }

    const fetchBlogs = () => {
      setLoading(true);
      Promise.all([BlogService.getPendingReview(), BlogService.getApproved()])
        .then(([pendingResponse, approvedResponse]: [any, any]) => {
          const pendingData = Array.isArray(pendingResponse?.data)
            ? pendingResponse.data
            : Array.isArray(pendingResponse)
            ? pendingResponse
            : [];
          setPendingBlogs(pendingData);

          const approvedData = Array.isArray(approvedResponse?.data)
            ? approvedResponse.data
            : Array.isArray(approvedResponse)
            ? approvedResponse
            : [];
          setApprovedBlogs(approvedData);
        })
        .catch((err) => {
          console.error("Lỗi khi tải danh sách blog:", err);
          setPendingBlogs([]);
          setApprovedBlogs([]);
        })
        .finally(() => setLoading(false));
    };

    fetchBlogs();
    fetchAllUsers()
      .then((res: any) => {
        const usersData = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setUsers(usersData);
      })
      .catch(() => setUsers([]));
  }, [isAdminOrManager, router]);

  const handleReview = async (blog: Blog, status: string, reason?: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await BlogService.review(blog.id, {
        status: status.toUpperCase(),
        ...(status.toUpperCase() === "REJECTED" && { rejectionReason: reason }),
        ...(status.toUpperCase() === "NEEDS_REVISION" && { revisionNotes: reason }),
      });
      const [pendingResponse, approvedResponse] = await Promise.all([
        BlogService.getPendingReview(),
        BlogService.getApproved(),
      ]);
      const pendingData = Array.isArray(pendingResponse?.data)
        ? pendingResponse.data
        : Array.isArray(pendingResponse)
        ? pendingResponse
        : [];
      setPendingBlogs(pendingData);

      const approvedData = Array.isArray(approvedResponse?.data)
        ? approvedResponse.data
        : Array.isArray(approvedResponse)
        ? approvedResponse
        : [];
      setApprovedBlogs(approvedData);
    } catch (err: any) {
      setError(err?.message || "Lỗi khi duyệt bài viết");
    } finally {
      setActionLoading(false);
      setSelectedBlog(null);
    }
  };

  const handlePublishClick = async (blog: Blog) => {
    setActionLoading(true);
    setError(null);
    try {
      await BlogService.publish(blog.id);
      const [pendingResponse, approvedResponse] = await Promise.all([
        BlogService.getPendingReview(),
        BlogService.getApproved(),
      ]);
      const pendingData = Array.isArray(pendingResponse?.data)
        ? pendingResponse.data
        : Array.isArray(pendingResponse)
        ? pendingResponse
        : [];
      setPendingBlogs(pendingData);

      const approvedData = Array.isArray(approvedResponse?.data)
        ? approvedResponse.data
        : Array.isArray(approvedResponse)
        ? approvedResponse
        : [];
      setApprovedBlogs(approvedData);
    } catch (err: any) {
      setError(err?.message || "Lỗi khi xuất bản bài viết");
    } finally {
      setActionLoading(false);
    }
  };

  function getAuthorName(authorId: string) {
    const user = users.find((u) => u.id === authorId);
    if (!user) return authorId;
    return (user.firstName || "") + (user.lastName ? " " + user.lastName : "");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Blog chờ duyệt & đã duyệt</h1>
      {isAdminOrManager ? (
        loading ? (
          <div>Đang tải...</div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-3 text-gray-700">
              Chờ duyệt ({pendingBlogs.length})
            </h2>
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
                      <div className="text-sm text-gray-600">
                        Chủ đề: {blog.category?.name || "Không có"}
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0">
                      <Button onClick={() => setSelectedBlog(blog)} disabled={actionLoading}>
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
                      <div className="text-sm text-gray-600">
                        Chủ đề: {blog.category?.name || "Không có"}
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0">
                      <Button
                        onClick={() => handlePublishClick(blog)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading}
                      >
                        Xuất bản
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      ) : (
        <div className="text-red-500">Bạn không có quyền truy cập trang này.</div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      <BlogReviewModal
        blog={selectedBlog}
        onClose={() => setSelectedBlog(null)}
        onReview={handleReview}
        loading={actionLoading}
      />

      <BlogPublishModal
        blog={selectedBlogToPublish}
        onClose={() => setSelectedBlogToPublish(null)}
        onPublishSuccess={() => {
          const [pendingResponse, approvedResponse] = await Promise.all([
            BlogService.getPendingReview(),
            BlogService.getApproved(),
          ]);
          const pendingData = Array.isArray(pendingResponse?.data)
            ? pendingResponse.data
            : Array.isArray(pendingResponse)
            ? pendingResponse
            : [];
          setPendingBlogs(pendingData);

          const approvedData = Array.isArray(approvedResponse?.data)
            ? approvedResponse.data
            : Array.isArray(approvedResponse)
            ? approvedResponse
            : [];
          setApprovedBlogs(approvedData);
        }}
      />
    </div>
  );
}