import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Inter everywhere: 600-700 for headings, 400 for text, 500 for buttons. --font-display points at it too.
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'CraftHire · Scope Change Desk',
  description: 'Hire a freelancer, share a SOW, and price every extra request before the work starts. Synthetic data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
