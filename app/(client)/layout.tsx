// Client side frame: sidebar, search, user. OWNER: Sanjana.
import AppShell from '@/components/shell/AppShell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="client">{children}</AppShell>;
}
