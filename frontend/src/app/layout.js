import './globals.css';
import { Space_Grotesk, Inter } from 'next/font/google';
import SmoothScroll from '@/components/SmoothScroll';
import SiteFrame from '@/components/SiteFrame';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' });

// Runs before paint to set the theme class — prevents flash of wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export const metadata = {
  metadataBase: new URL('https://ozsecuresecurity.com.au'),
  title: {
    default: 'OzSecure Services — Security, Traffic Control, Cleaning & Labour Hire',
    template: '%s | OzSecure Services',
  },
  description:
    'One accredited provider for security, traffic control, commercial cleaning and labour hire across Sydney & Greater NSW. 24/7 operations, supervised crews.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'OzSecure Services',
    description: 'Security, traffic control, cleaning and labour hire — one accountable provider across NSW.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU" suppressHydrationWarning className={`${body.variable} ${display.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SmoothScroll>
          <SiteFrame>{children}</SiteFrame>
        </SmoothScroll>
      </body>
    </html>
  );
}
