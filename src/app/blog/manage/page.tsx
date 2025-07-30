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
import { useToast } from "@/components/ui/use-toast";
import BlogPublishModal from "@/components/BlogPublishModal";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { Pagination } from "@/components/ui/pagination";
import { PaginationResponse } from "@/types/api.d"; // Import PaginationResponse

export default function BlogManagePage() {
  const { user } = useAuth();
  let roleName = "";
  if (
    user?.role &&
    typeof user.role === "object" &&
    typeof user.role.name === "string"
  ) {
    roleName = user.role.name.toLowerCase();
  }
  const canCreate = ["admin", "manager", "consultant"].includes(roleName);

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [editBlog, setEditBlog] = useState<any | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedBlogReason, setSelectedBlogReason] = useState({
    rejectionReason: "",
    revisionNotes: "",
  });
  const router = useRouter();
  const { toast } = useToast();
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [modalActionType, setModalActionType] = useState<'publish' | 'approve' | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const itemsPerPage = 10;

  const fetchBlogs = () => {
    if (!canCreate) return;
    setLoading(true);
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (search) params.title = search;
    if (status) params.status = status;
    if (roleName === "consultant" && user?.id) {
      params.authorId = user.id;
    }

    console.log("Fetching blogs with params:", params);

    BlogService.getAll(params)
      .then((response: PaginationResponse<Blog>) => {
        console.log("BlogService.getAll raw response:", response);
        if (response && response.data && Array.isArray(response.data) && response.meta) {
          const total = typeof response.meta.totalItems === 'number' ? response.meta.totalItems : 0;
          const totalPagesCount = typeof response.meta.totalPages === 'number' ? response.meta.totalPages : 1;
          setBlogs(response.data);
          setTotalPages(totalPagesCount);
          setTotalBlogs(total);
        } else {
          setBlogs([]);
          setTotalPages(1);
          setTotalBlogs(0);
        }
      })
      .catch((err) => {
        console.error("Error fetching blogs:", err);
        setBlogs([]);
        setTotalPages(1);
        setTotalBlogs(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
    if (roleName === "admin" || roleName === "manager") {
      fetchAllUsers()
        .then((res) => {
          if (Array.isArray(res?.data)) setUsers(res.data);
          else if (Array.isArray(res)) setUsers(res);
          else setUsers([]);
        })
        .catch(() => setUsers([]));
    } else {
      if (user) {
        setUsers([user]);
      }
    }
  }, [canCreate, search, status, user, roleName, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push(-1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(-1);
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // FIX: Changed to a function expression (const/arrow function)
  const getAuthorName = (authorId: string) => {
    const user = users.find((u) => u.id === authorId);
    if (!user) return authorId;
    return (user.firstName || "") + (user.lastName ? " " + user.lastName : "");
  };

  const handleOpenReasonModal = (blog: Blog) => {
    setSelectedBlogReason({
      rejectionReason: blog.rejectionReason || "",
      revisionNotes: blog.revisionNotes || "",
    });
    setReasonModalOpen(true);
  };

  const handlePublishBlog = (blog: Blog) => {
    setSelectedBlog(blog);
    setModalActionType("publish");
    setPublishModalOpen(true);
  };

  const handleApproveBlog = (blog: Blog) => {
    setSelectedBlog(blog);
    setModalActionType("approve");
    setPublishModalOpen(true);
  };

  const handleArchiveBlog = async (blogId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu trữ blog này?")) return;
    try {
      await BlogService.archive(blogId);
      toast({
        title: "Thành công!",
        description: "Đã lưu trữ blog thành công.",
      });
      fetchBlogs();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Lưu trữ blog thất bại.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlog = (id: string) => {
    setBlogToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      await BlogService.delete(blogToDelete);
      setBlogs((prev) => prev.filter((b) => b.id !== blogToDelete));
      toast({
        title: "Thành công!",
        description: "Đã xoá blog thành công.",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Xoá blog thất bại",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setBlogToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
        {canCreate && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Trạng thái</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="needs_revision">Needs Revision</option>
              <option value="rejected">Rejected</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <Link href="/blog/new">
              <Button>Thêm bài viết</Button>
            </Link>
            {roleName === "admin" || roleName === "manager" ? (
              <>
                <Link href="/blog/categories">
                  <Button variant="outline">Quản lý chủ đề</Button>
                </Link>
              </>
            ) : null}
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
                      <div className="flex flex-wrap gap-2 justify-center">
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
                        {roleName === "admin" || roleName === "manager" ? (
                          <>
                            {(blog.status === "draft" || blog.status === "approved") && (
                              <Button
                                size="sm"
                                onClick={() => handlePublishBlog(blog)}
                              >
                                Xuất bản
                              </Button>
                            )}
                            {blog.status === "pending_review" && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveBlog(blog)}
                              >
                                Duyệt
                              </Button>
                            )}
                            {blog.status === "published" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleArchiveBlog(blog.id)}
                              >
                                Lưu trữ
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteBlog(blog.id)}
                            >
                              Xoá
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBlog(blog.id)}
                          >
                            Xoá
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
                      {blog.id && showImageModal === blog.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
                            <button
                              className="absolute top-2 right-2 text-xl"
                              onClick={() => setShowImageModal(null)}
                            >
                              &times;
                            </button>
                            <h3 className="text-lg font-bold mb-4">
                              Cập nhật ảnh cho blog
                            </h3>
                            <BlogCreateWithImage blogId={blog.id} />
                          </div>
                        </div>
                      )}
                      {blog.id && editBlog && editBlog.id === blog.id && (
                        <EditBlogModal
                          blog={editBlog}
                          onClose={() => setEditBlog(null)}
                          onSuccess={() => {
                            setEditBlog(null);
                            fetchBlogs();
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={getPageNumbers()}
              hasNextPage={currentPage < totalPages}
              hasPreviousPage={currentPage > 1}
              onPageChange={handlePageChange}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              onFirstPage={handleFirstPage}
              onLastPage={handleLastPage}
            />
            </div>
          </div>
        ))}
      <BlogReasonModal
        open={reasonModalOpen}
        onClose={() => setReasonModalOpen(false)}
        rejectionReason={selectedBlogReason.rejectionReason || ""}
        revisionNotes={selectedBlogReason.revisionNotes || ""}
      />
      {selectedBlog && publishModalOpen && (
        <BlogPublishModal
          onClose={() => {
            setPublishModalOpen(false);
            setSelectedBlog(null);
            setModalActionType(null);
          }}
          blog={selectedBlog}
          onPublishSuccess={() => {
            setPublishModalOpen(false);
            setSelectedBlog(null);
            setModalActionType(null);
            fetchBlogs();
          }}
          isApproveAction={modalActionType === 'approve'}
        />
      )}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}