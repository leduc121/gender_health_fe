"use client";

import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    title: "Trang chủ",
    href: "/",
  },
  {
    title: "Dịch vụ",
    href: "/services",
  },
  {
    title: "Tư vấn trực tuyến",
    href: "/consultant",
  },
  {
    title: "Xét nghiệm STI",
    href: "/sti-testing",
  },
  {
    title: "Theo dõi chu kỳ",
    href: "/menstrual-tracker",
  },
  {
    title: "Blog",
    href: "/blog",
  },
];

export function MainNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  const filteredNavItems = mainNavItems.filter((item) => {
    if (item.href === "/menstrual-tracker") {
      return isAuthenticated && user?.gender === "F";
    }
    return true;
  });

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <div className="w-28 h-12 flex items-center justify-center rounded-lg border-2 border-black bg-white shadow">
          <span className="font-size-12 font-bold text-black italic">
            Healthcare
          </span>
        </div>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {isLoading ? (
          <div className="flex items-center space-x-6">
            {mainNavItems.map((item, index) => (
              <div
                key={index}
                className="h-4 w-16 animate-pulse bg-muted rounded"
              />
            ))}
          </div>
        ) : (
          <>
            {filteredNavItems.map((item) => {
              if (item.href === "/sti-testing" && !isAuthenticated) {
                return (
                  <AuthDialog
                    key={item.href}
                    trigger={
                      <span
                        className={cn(
                          "transition-colors hover:text-foreground/80 cursor-pointer",
                          pathname === item.href
                            ? "text-foreground"
                            : "text-foreground/60"
                        )}
                      >
                        {item.title}
                      </span>
                    }
                  />
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}

            <div className="flex items-center space-x-4"></div>
          </>
        )}
      </nav>
    </div>
  );
}
