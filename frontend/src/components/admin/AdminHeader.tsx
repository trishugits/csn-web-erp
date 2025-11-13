import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api";

interface AdminProfile {
  name: string;
  email: string;
  adminId: string;
}

export const AdminHeader = () => {
  const { user } = useAuth();
  const [adminName, setAdminName] = useState<string>("Admin User");
  const [initials, setInitials] = useState<string>("AU");

  const { data: profileData } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: () => authApi.getProfile('admin'),
    enabled: !!user && user.role === 'admin',
  });

  useEffect(() => {
    if (profileData?.data?.profile) {
      const profile = profileData.data.profile as AdminProfile;
      const name = profile.name || user?.name || "Admin User";
      setAdminName(name);

      // Generate initials from name
      const nameParts = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2);

      setInitials(nameParts.length > 0 ? nameParts.join('') : 'AU');
    } else if (user?.name) {
      setAdminName(user.name);
      const nameParts = user.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2);
      setInitials(nameParts.length > 0 ? nameParts.join('') : 'AU');
    }
  }, [profileData, user]);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* School Name */}
        <h1 className="text-3xl md:text-2xl font-bold text-black tracking-wide">
          Chandravali Shiksha Niketan, Ghazipur
        </h1>

        {/* Admin Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{adminName}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
