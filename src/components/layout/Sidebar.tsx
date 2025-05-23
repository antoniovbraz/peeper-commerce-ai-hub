
import { cn } from "@/lib/utils";
import { BarChart4, ShoppingBag, LucideIcon, Settings, CircleDollarSign, FileText, Home } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
}

const SidebarItem = ({ icon: Icon, label, href }: SidebarItemProps) => {
  return (
    <NavLink
      to={href}
      className={({ isActive }) => 
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

export const Sidebar = () => {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white">
      <div className="py-6 px-4">
        <h1 className="text-xl font-bold">Social Peepers AI Hub</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <SidebarItem icon={Home} label="Dashboard" href="/dashboard" />
        <SidebarItem icon={ShoppingBag} label="Catálogo" href="/catalog" />
        <SidebarItem icon={FileText} label="Gerador de Conteúdo" href="/content-generator" />
        <SidebarItem icon={CircleDollarSign} label="Precificador" href="/pricer" />
        <SidebarItem icon={BarChart4} label="Análise de Vendas" href="/sales" />
        <SidebarItem icon={Settings} label="Configurações" href="/settings" />
      </nav>
    </aside>
  );
};
