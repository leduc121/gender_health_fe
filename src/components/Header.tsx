"use client";

import AuthDialog from "@/components/AuthDialog";
import { MainNav } from "@/components/main-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, LayoutDashboard, LogOut, User } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ThemeSwitcher />
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full ml-2"
                  >
                    <Avatar className="h-8 w-8">
                      {user?.profilePicture ? (
                        <AvatarImage
                          src={user.profilePicture}
                          alt={user?.firstName || "avatar"}
                        />
                      ) : (
                        <AvatarFallback>
                          {user?.fullName
                            ? user.fullName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                            : (user?.firstName?.[0] || "") +
                              (user?.lastName?.[0] || "")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      Tài khoản
                    </Link>
                  </DropdownMenuItem>
                  {user && (
                    <>
                      {!(
                        (typeof user?.role === "string" &&
                          (user.role === "admin" || user.role === "manager")) ||
                        (typeof user?.role === "object" &&
                          (user.role?.name === "admin" ||
                            user.role?.name === "manager"))
                      ) && (
                        <DropdownMenuItem asChild>
                          <Link href="/profile/appointments" className="w-full">
                            <Calendar className="mr-2 h-4 w-4" />
                            Lịch tư vấn của tôi
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {((typeof user?.role === "string" &&
                        user.role === "consultant") ||
                        (typeof user?.role === "object" &&
                          user.role?.name === "consultant")) && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/consultant" className="w-full">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard tư vấn viên
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.gender === "F" && (
                        <DropdownMenuItem asChild>
                          <Link href="/menstrual-tracker" className="w-full">
                            <Calendar className="mr-2 h-4 w-4" />
                            Theo dõi chu kỳ
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {((typeof user?.role === "string" &&
                    (user.role === "admin" || user.role === "manager")) ||
                    (typeof user?.role === "object" &&
                      (user.role?.name === "admin" ||
                        user.role?.name === "manager"))) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full">
                        <User className="mr-2 h-4 w-4" />
                        Trang Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <AuthDialog
                trigger={<Button variant="outline">Đăng nhập</Button>}
              />
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
