import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scope Change Desk',
  description: 'Hire a freelancer, share a SOW, and price every extra request before the work starts. Synthetic data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
