
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProfileWithRole } from "@/lib/types";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileWithRole | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile(profileData as ProfileWithRole);
        setIsAdmin(profileData.role === 'admin');
      } catch (error) {
        console.error("Erro ao verificar status de admin:", error);
        setIsAdmin(false);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading, profile };
};
