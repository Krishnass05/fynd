// Freelancer side frame: sidebar, search, user. OWNER: Krishna.
import AppShell from '@/components/shell/AppShell';

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="freelancer">{children}</AppShell>;
}
