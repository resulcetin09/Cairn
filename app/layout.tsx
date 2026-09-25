import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Cairn | Hedef ortak. Katkın sana özel.',
  description: 'Gizli katkılar, ortak hedefler. Ya hep ya hiç crowdfunding fikrini etkileşimli bir demoyla keşfet.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" suppressHydrationWarning><head><link rel="preload" href="/fonts/geist-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/hero.webp" as="image" /><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('crowdfunding-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}`}} /></head><body>{children}</body></html>;
}
