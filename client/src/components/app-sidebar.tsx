import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Settings,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: FileText,
  },
  {
    title: "Cadastro de Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Notas Fiscais",
    url: "/notas-fiscais",
    icon: Receipt,
  },
  {
    title: "Gestão Administrativa",
    url: "/gestao-administrativa",
    icon: Settings,
  },
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">SC</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Sistema Corporativo</h2>
            <p className="text-xs text-muted-foreground">Gestão Integrada</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {location === item.url && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p>Usuário: admin@empresa.com</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
