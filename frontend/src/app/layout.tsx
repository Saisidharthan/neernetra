import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoBar from '@/components/DemoBar';
import { SimProvider } from '@/components/ews/SimProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NeerNetra | Community water-borne illness early warning',
  description:
    'NeerNetra ("water eye") detects water-borne outbreaks early: CDC EARS statistics plus an XGBoost risk model with TreeSHAP explanations, upstream-to-downstream spread, app notifications to field workers and citizens, and a closed intervention loop. Built on ArogyaPurvottar (MIT).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased transition-colors duration-200`}>
        <ThemeProvider>
          <SimProvider>
            <div className="sticky top-0 z-50">
              <Navbar />
              <DemoBar />
            </div>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </SimProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
