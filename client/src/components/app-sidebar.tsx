import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  FileCheck,
  Receipt,
  Settings,
  Megaphone,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Newspaper,
  DollarSign,
  Briefcase,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
    title: "Autorizações",
    url: "/autorizacoes",
    icon: FileCheck,
  },
  {
    title: "Notas Fiscais",
    url: "/notas-fiscais",
    icon: Receipt,
  },
  {
    title: "Marketing",
    url: "/marketing",
    icon: Megaphone,
  },
];

const gestaoAdminSubitems = [
  {
    title: "Orçamentos",
    url: "/gestao-administrativa/orcamentos",
    icon: FileSpreadsheet,
  },
  {
    title: "Publicações",
    url: "/gestao-administrativa/publicacoes",
    icon: Newspaper,
  },
  {
    title: "Faturamento",
    url: "/gestao-administrativa/faturamento",
    icon: DollarSign,
  },
  {
    title: "Administrativo",
    url: "/gestao-administrativa/administrativo",
    icon: Briefcase,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const [gestaoOpen, setGestaoOpen] = useState(
    location.startsWith("/gestao-administrativa")
  );

  const isGestaoActive = location.startsWith("/gestao-administrativa");

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

              <SidebarMenuItem>
                <Collapsible open={gestaoOpen} onOpenChange={setGestaoOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isGestaoActive}
                      data-testid="link-gestao-administrativa"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Gestão Administrativa</span>
                      {gestaoOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="ml-4 mt-1 border-l pl-2">
                      {gestaoAdminSubitems.map((subitem) => (
                        <SidebarMenuItem key={subitem.title}>
                          <SidebarMenuButton
                            onClick={() => setLocation(subitem.url)}
                            isActive={location === subitem.url}
                            data-testid={`link-gestao-${subitem.title.toLowerCase()}`}
                          >
                            <subitem.icon className="h-4 w-4" />
                            <span>{subitem.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
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
