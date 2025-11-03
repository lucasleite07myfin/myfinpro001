import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Tag, 
  ArrowLeft,
  Shield
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin',
    },
    {
      title: 'Usuários',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Assinaturas',
      icon: CreditCard,
      href: '/admin/subscriptions',
    },
    {
      title: 'Cupons',
      icon: Tag,
      href: '/admin/coupons',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 space-y-2">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao App
            </Link>
            <Separator />
            <div className="flex items-center gap-2 pt-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-lg font-bold">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">Gerenciamento</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Menu */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        active && "bg-secondary font-medium"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
