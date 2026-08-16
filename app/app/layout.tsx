import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'My Project Admin',
  description: 'Solana admin dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
