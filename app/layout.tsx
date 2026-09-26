import type { Metadata } from 'next';
import './globals.css';
import './cinematic.css';
import { WalletProvider } from './wallet-context';

export const metadata: Metadata = {
  title: 'Cairn | Hedef ortak. Katkın sana özel.',
  description: 'Gizli katkılar, ortak hedefler. Ya hep ya hiç crowdfunding fikrini etkileşimli bir demoyla keşfet.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/geist-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/film/cairn-valley-poster.webp" as="image" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('crowdfunding-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){}`,
          }}
        />
      </head>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
