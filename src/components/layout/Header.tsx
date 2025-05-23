
import { useAuth } from "@/hooks/useAuth";
import { Bell, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <h2 className="text-lg font-medium md:hidden">Social Peepers AI Hub</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
