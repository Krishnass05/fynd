// Freelancer side shell. OWNER: Krishna.
import TopBar from '@/components/shell/TopBar';

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar role="freelancer" />
      <main id="main-content" className="page">{children}</main>
    </>
  );
}
