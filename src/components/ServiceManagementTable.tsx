"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Service,
  APIService,
  GetServicesQuery,
  UpdateServiceDto,
} from "@/services/service.service";
import { API_FEATURES } from "@/config/api";
import { Pagination } from "@/components/ui/pagination";
import { PaginationInfo } from "@/components/ui/pagination-info";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Ensure Label is imported
import { Textarea } from "@/components/ui/textarea"; // For description
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { Category, CategoryService } from "@/services/category.service"; // Import CategoryService and Category
import { formatCurrency } from "@/lib/utils";

export default function ServiceManagementTable() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from AuthContext
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(API_FEATURES.PAGINATION.DEFAULT_PAGE);
  const [totalServices, setTotalServices] = useState(0);
  const [searchQuery, setSearchQuery] = useState(""); // For service name/description
  const [filterCategory, setFilterCategory] = useState<string>(""); // For categoryId
  const [filterActiveStatus, setFilterActiveStatus] = useState<string>(""); // For isActive
  const [filterRequiresConsultant, setFilterRequiresConsultant] = useState<string>(""); // For requiresConsultant
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false); // New state for edit dialog
  const [isViewServiceDetailDialogOpen, setIsViewServiceDetailDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null); // State for service being edited
  const [isUploadImageDialogOpen, setIsUploadImageDialogOpen] = useState(false); // New state for image upload dialog
  const [selectedServiceForImage, setSelectedServiceForImage] = useState<Service | null>(null); // New state for selected service for image upload
  const [categories, setCategories] = useState<Category[]>([]); // State for categories
  const [newService, setNewService] = useState<Partial<Service>>({ // State for new service form
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    duration: 30,
    categoryId: "",
    location: undefined, // Changed to undefined to match type
    requiresConsultant: false,
    isActive: true,
    featured: false,
    prerequisites: "",
    postInstructions: "",
  });


  const limit = API_FEATURES.PAGINATION.DEFAULT_LIMIT;

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const query: GetServicesQuery = {
        page: currentPage,
        limit: limit,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };

      if (searchQuery) {
        query.search = searchQuery;
      }
      if (filterCategory) {
        query.categoryId = filterCategory;
      }
      if (filterActiveStatus) {
        query.isActive = filterActiveStatus === "active" ? true : false;
      }
      if (filterRequiresConsultant && filterRequiresConsultant !== "all") {
        query.requiresConsultant = filterRequiresConsultant === "true" ? true : false;
      }

      const response = await APIService.getAll(query);
      setServices(response.data);
      setTotalServices(response.total);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err?.message || "Lỗi khi tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories(); // Fetch categories when component mounts
  }, [currentPage, searchQuery, filterCategory, filterActiveStatus, filterRequiresConsultant]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      try {
        await APIService.deleteService(id);
        toast({
          title: "Thành công",
          description: "Dịch vụ đã được xóa.",
        });
        fetchServices();
      } catch (err: any) {
        toast({
          title: "Lỗi",
          description: `Không thể xóa dịch vụ: ${err.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const totalPages = Math.ceil(totalServices / limit);

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

  const handleAddServiceClick = () => {
    setNewService({ // Reset form for new service
      name: "",
      description: "",
      shortDescription: "",
      price: 0,
      duration: 30,
      categoryId: "",
      location: undefined,
      requiresConsultant: false,
      isActive: true,
      featured: false,
      prerequisites: "",
      postInstructions: "",
    });
    setIsAddServiceDialogOpen(true);
  };

  const handleEditServiceClick = (service: Service) => {
    setServiceToEdit(service);
    setIsEditServiceDialogOpen(true);
  };

  const handleViewServiceDetailsClick = (service: Service) => {
    setSelectedService(service);
    setIsViewServiceDetailDialogOpen(true);
  };

  const handleCloseAddServiceDialog = () => {
    setIsAddServiceDialogOpen(false);
  };

  const handleCloseEditServiceDialog = () => {
    setIsEditServiceDialogOpen(false);
    setServiceToEdit(null);
  };

  const handleCloseViewServiceDetailDialog = () => {
    setIsViewServiceDetailDialogOpen(false);
    setSelectedService(null);
  };

  const fetchCategories = async () => {
    try {
      const response = await CategoryService.getAllCategories();
      setCategories(response); // Removed .data
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh mục.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewService((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string | boolean) => {
    setNewService((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddNewService = async () => {
    try {
      // Ensure all required fields are present before sending
      const serviceToCreate = {
        name: newService.name || "",
        description: newService.description || "",
        price: newService.price ?? 0,
        duration: newService.duration ?? 0,
        categoryId: newService.categoryId || "",
        isActive: newService.isActive ?? true,
        shortDescription: newService.shortDescription || "",
        prerequisites: newService.prerequisites || "",
        postInstructions: newService.postInstructions || "",
        featured: newService.featured ?? false,
        requiresConsultant: newService.requiresConsultant ?? false,
        location: newService.location,
      };

      // Basic validation for required fields
      if (!serviceToCreate.name || !serviceToCreate.description || !serviceToCreate.categoryId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ các trường bắt buộc (Tên, Mô tả, Danh mục).",
          variant: "destructive",
        });
        return;
      }

      await APIService.createService(serviceToCreate);
      toast({
        title: "Thành công",
        description: "Dịch vụ mới đã được thêm.",
      });
      setIsAddServiceDialogOpen(false);
      setNewService({ // Reset form
        name: "",
        description: "",
        shortDescription: "",
        price: 0,
        duration: 30,
        categoryId: "",
        location: undefined, // Changed to undefined to match type
        requiresConsultant: false,
        isActive: true,
        featured: false,
        prerequisites: "",
        postInstructions: "",
      });
      fetchServices(); // Refresh service list
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: `Không thể thêm dịch vụ: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleServiceAdded = () => {
    // This function is now redundant as handleAddNewService handles the success toast and fetchServices
    // Keeping it for now in case it's called elsewhere, but it should be replaced by handleAddNewService
    setIsAddServiceDialogOpen(false);
    fetchServices(); // Refresh service list
    toast({
      title: "Thành công",
      description: "Dịch vụ mới đã được thêm.",
    });
  };

  const handleUploadImageClick = (service: Service) => {
    setSelectedServiceForImage(service);
    setIsUploadImageDialogOpen(true);
  };

  const handleCloseUploadImageDialog = () => {
    setIsUploadImageDialogOpen(false);
    setSelectedServiceForImage(null);
  };

  const handleImageUploaded = () => {
    setIsUploadImageDialogOpen(false);
    fetchServices(); // Refresh service list to show new image if applicable
    toast({
      title: "Thành công",
      description: "Ảnh đã được thêm vào dịch vụ.",
    });
  };

  const userRoleName = typeof user?.role === "object" ? user.role.name : user?.role;
  const isAdminOrManager = userRoleName === "admin" || userRoleName === "manager";
  const isConsultant = userRoleName === "consultant";
  const isStaff = userRoleName === "staff";
  const isCustomer = userRoleName === "customer";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Input
            placeholder="Tìm kiếm dịch vụ..."
            className="w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* You might need to fetch categories for this select */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {/* Add dynamic categories here */}
            </SelectContent>
          </Select>
          <Select value={filterActiveStatus} onValueChange={setFilterActiveStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRequiresConsultant} onValueChange={setFilterRequiresConsultant}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Yêu cầu tư vấn viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Có</SelectItem>
              <SelectItem value="false">Không</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdminOrManager && (
          <Button onClick={handleAddServiceClick}>Thêm dịch vụ mới</Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải dịch vụ...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Không có dịch vụ nào.</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên dịch vụ</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Thời lượng (phút)</TableHead>
                <TableHead>Yêu cầu TVV</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{formatCurrency(service.price ?? 0)}</TableCell>
                  <TableCell>{service.duration}</TableCell>
                  <TableCell>{service.requiresConsultant ? "Có" : "Không"}</TableCell>
                  <TableCell>
                    <Badge variant={service.isActive === true ? "default" : "secondary"}>
                      {service.isActive === true ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(service.createdAt), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewServiceDetailsClick(service)}>
                        Chi tiết
                      </Button>
                      {isAdminOrManager && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEditServiceClick(service)}>
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUploadImageClick(service)}
                          >
                            Thêm ảnh
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Xóa
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <PaginationInfo
              totalItems={totalServices}
              itemsPerPage={limit}
              currentPage={currentPage}
              itemName="dịch vụ"
            />
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
        </>
      )}

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Thêm dịch vụ mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo dịch vụ mới.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên dịch vụ
              </Label>
              <Input id="name" value={newService.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Mô tả chi tiết
              </Label>
              <Textarea id="description" value={newService.description} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortDescription" className="text-right">
                Mô tả ngắn
              </Label>
              <Input id="shortDescription" value={newService.shortDescription} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Giá (VND)
              </Label>
              <Input id="price" type="number" value={newService.price ?? 0} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Thời lượng (phút)
              </Label>
              <Input id="duration" type="number" value={newService.duration ?? 0} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Danh mục
              </Label>
              <Select
                value={newService.categoryId}
                onValueChange={(value) => handleSelectChange("categoryId", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Địa điểm
              </Label>
              <Select
                value={newService.location}
                onValueChange={(value) => handleSelectChange("location", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn địa điểm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Trực tuyến</SelectItem>
                  <SelectItem value="office">Tại phòng khám</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requiresConsultant" className="text-right">
                Yêu cầu TVV
              </Label>
              <Select
                value={newService.requiresConsultant?.toString()}
                onValueChange={(value) => handleSelectChange("requiresConsultant", value === "true")}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Có</SelectItem>
                  <SelectItem value="false">Không</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Hoạt động
              </Label>
              <Select
                value={newService.isActive?.toString()}
                onValueChange={(value) => handleSelectChange("isActive", value === "true")}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Có</SelectItem>
                  <SelectItem value="false">Không</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="featured" className="text-right">
                Nổi bật
              </Label>
              <Select
                value={newService.featured?.toString()}
                onValueChange={(value) => handleSelectChange("featured", value === "true")}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Có</SelectItem>
                  <SelectItem value="false">Không</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prerequisites" className="text-right">
                Điều kiện tiên quyết
              </Label>
              <Textarea id="prerequisites" value={newService.prerequisites} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postInstructions" className="text-right">
                Hướng dẫn sau dịch vụ
              </Label>
              <Textarea id="postInstructions" value={newService.postInstructions} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAddServiceDialog}>Hủy</Button>
            <Button onClick={handleAddNewService}>Thêm dịch vụ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      {isEditServiceDialogOpen && serviceToEdit && (
        <EditServiceDialog
          service={serviceToEdit}
          isOpen={isEditServiceDialogOpen}
          onClose={handleCloseEditServiceDialog}
          onServiceUpdated={() => {
            fetchServices(); // Refresh list after update
            toast({
              title: "Thành công",
              description: "Dịch vụ đã được cập nhật.",
            });
          }}
          categories={categories} // Pass categories to the edit dialog
        />
      )}

      {/* View Service Detail Dialog */}
      <Dialog open={isViewServiceDetailDialogOpen} onOpenChange={setIsViewServiceDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết dịch vụ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết của dịch vụ.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="max-h-[700px] overflow-y-auto p-4 border rounded-md grid gap-4 py-4">
              {selectedService.images && selectedService.images.length > 0 ? (
                <div className="col-span-4 flex justify-center">
                  <img
                    src={selectedService.images[0].url}
                    alt={selectedService.name}
                    className="w-48 h-48 object-cover rounded-md"
                  />
                </div>
              ) : (
                <div className="col-span-4 flex justify-center items-center w-48 h-48 bg-gray-200 rounded-md text-gray-500">
                  Không có ảnh
                </div>
              )}
              <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">ID:</Label>
                <span className="col-span-3">{selectedService.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tên dịch vụ:</Label>
                <span className="col-span-3">{selectedService.name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Mô tả chi tiết:</Label>
                <span className="col-span-3">{selectedService.description}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Mô tả ngắn:</Label>
                <span className="col-span-3">{selectedService.shortDescription || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Giá:</Label>
                <span className="col-span-3">{selectedService.price != null ? formatCurrency(selectedService.price) : "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Thời lượng:</Label>
                <span className="col-span-3">{selectedService.duration} phút</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Danh mục:</Label>
                <span className="col-span-3">
                  {selectedService.category.name || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Địa điểm:</Label>
                <span className="col-span-3">{selectedService.location || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Yêu cầu TVV:</Label>
                <span className="col-span-3">{selectedService.requiresConsultant ? "Có" : "Không"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Trạng thái:</Label>
                <span className="col-span-3">
                  <Badge variant={selectedService.isActive === true ? "default" : "secondary"}>
                    {selectedService.isActive === true ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nổi bật:</Label>
                <span className="col-span-3">{selectedService.featured ? "Có" : "Không"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Điều kiện tiên quyết:</Label>
                <span className="col-span-3">{selectedService.prerequisites || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Hướng dẫn sau dịch vụ:</Label>
                <span className="col-span-3">{selectedService.postInstructions || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ngày tạo:</Label>
                <span className="col-span-3">{format(new Date(selectedService.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Cập nhật cuối:</Label>
                <span className="col-span-3">{format(new Date(selectedService.updatedAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
            </div>
          </div>
          )}
          <DialogFooter>
            <Button onClick={handleCloseViewServiceDetailDialog}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Image Dialog */}
      {selectedServiceForImage && (
        <UploadImageDialog
          service={selectedServiceForImage}
          isOpen={isUploadImageDialogOpen}
          onClose={handleCloseUploadImageDialog}
          onImageUploaded={handleImageUploaded}
        />
      )}
    </div>
  );
}

interface EditServiceDialogProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onServiceUpdated: () => void;
  categories: Category[];
}

function EditServiceDialog({ service, isOpen, onClose, onServiceUpdated, categories }: EditServiceDialogProps) {
  const { toast } = useToast();
  const [editedService, setEditedService] = useState<Partial<Service>>(service);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEditedService(service);
  }, [service]);

  const handleServiceChange = (field: keyof Service, value: any) => {
    setEditedService((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateService = async () => {
    setIsUpdating(true);
    try {
      // Construct the payload with only the necessary fields for an update
      const serviceToUpdate: UpdateServiceDto = {
        name: editedService.name,
        description: editedService.description,
        price: editedService.price ?? undefined,
        duration: editedService.duration ?? undefined,
        categoryId: editedService.categoryId,
        isActive: editedService.isActive,
        shortDescription: editedService.shortDescription,
        prerequisites: editedService.prerequisites,
        postInstructions: editedService.postInstructions,
        featured: editedService.featured,
        requiresConsultant: editedService.requiresConsultant,
        location: editedService.location,
      };

      // Basic validation
      if (!serviceToUpdate.name || !serviceToUpdate.description || !serviceToUpdate.categoryId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ các trường bắt buộc (Tên, Mô tả, Danh mục).",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      await APIService.updateService(service.id, serviceToUpdate);
      onServiceUpdated();
      onClose();
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast({
        title: "Lỗi",
        description: `Không thể cập nhật dịch vụ: ${error.message || "Lỗi không xác định"}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin dịch vụ.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên dịch vụ
            </Label>
            <Input id="name" value={editedService.name || ""} onChange={(e) => handleServiceChange("name", e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Mô tả chi tiết
            </Label>
            <Textarea id="description" value={editedService.description || ""} onChange={(e) => handleServiceChange("description", e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shortDescription" className="text-right">
              Mô tả ngắn
            </Label>
            <Input id="shortDescription" value={editedService.shortDescription || ""} onChange={(e) => handleServiceChange("shortDescription", e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Giá (VND)
            </Label>
            <Input id="price" type="number" value={editedService.price ?? 0} onChange={(e) => handleServiceChange("price", parseFloat(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Thời lượng (phút)
            </Label>
            <Input id="duration" type="number" value={editedService.duration ?? 0} onChange={(e) => handleServiceChange("duration", parseInt(e.target.value, 10))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categoryId" className="text-right">
              Danh mục
            </Label>
            <Select
              value={editedService.categoryId || ""}
              onValueChange={(value) => handleServiceChange("categoryId", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Địa điểm
            </Label>
            <Select
              value={editedService.location || ""}
              onValueChange={(value) => handleServiceChange("location", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn địa điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Trực tuyến</SelectItem>
                <SelectItem value="office">Tại phòng khám</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requiresConsultant" className="text-right">
              Yêu cầu TVV
            </Label>
            <Select
              value={editedService.requiresConsultant?.toString() || ""}
              onValueChange={(value) => handleServiceChange("requiresConsultant", value === "true")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Có</SelectItem>
                <SelectItem value="false">Không</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Hoạt động
            </Label>
            <Select
              value={editedService.isActive?.toString() || ""}
              onValueChange={(value) => handleServiceChange("isActive", value === "true")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Có</SelectItem>
                <SelectItem value="false">Không</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="featured" className="text-right">
              Nổi bật
            </Label>
            <Select
              value={editedService.featured?.toString() || ""}
              onValueChange={(value) => handleServiceChange("featured", value === "true")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Có</SelectItem>
                <SelectItem value="false">Không</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prerequisites" className="text-right">
              Điều kiện tiên quyết
            </Label>
            <Textarea id="prerequisites" value={editedService.prerequisites || ""} onChange={(e) => handleServiceChange("prerequisites", e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postInstructions" className="text-right">
              Hướng dẫn sau dịch vụ
            </Label>
            <Textarea id="postInstructions" value={editedService.postInstructions || ""} onChange={(e) => handleServiceChange("postInstructions", e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>Hủy</Button>
          <Button onClick={handleUpdateService} disabled={isUpdating}>
            {isUpdating ? "Đang cập nhật..." : "Cập nhật dịch vụ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UploadImageDialogProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: () => void;
}

function UploadImageDialog({ service, isOpen, onClose, onImageUploaded }: UploadImageDialogProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadAndAssociate = async () => {
    if (!selectedFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một ảnh để tải lên.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload the image
      const uploadResponse = await APIService.uploadServiceImage(selectedFile, service.id);
      const imageId = uploadResponse.id;

      // 2. Associate the image with the service
      await APIService.addImageToService(service.id, imageId);

      toast({
        title: "Thành công",
        description: "Ảnh đã được tải lên và liên kết với dịch vụ.",
      });
      onImageUploaded();
    } catch (error: any) {
      console.error("Error uploading or associating image:", error);
      toast({
        title: "Lỗi",
        description: `Không thể thêm ảnh: ${error.message || "Lỗi không xác định"}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null); // Clear selected file
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm ảnh cho dịch vụ</DialogTitle>
          <DialogDescription>
            Tải lên một ảnh mới cho dịch vụ "{service.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">
              Chọn ảnh
            </Label>
            <Input
              id="image"
              type="file"
              className="col-span-3"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {selectedFile && (
            <div className="col-span-4 text-center text-sm text-gray-500">
              Đã chọn: {selectedFile.name}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button onClick={handleUploadAndAssociate} disabled={isUploading || !selectedFile}>
            {isUploading ? "Đang tải lên..." : "Tải lên và thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
