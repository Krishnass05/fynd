// Client side shell. OWNER: Sanjana.
import TopBar from '@/components/shell/TopBar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar role="client" />
      <main className="page">{children}</main>
    </>
  );
}
