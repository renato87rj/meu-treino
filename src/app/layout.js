import "./globals.css";
import Providers from '../components/Providers';

export const metadata = {
  title: 'Meus Treinos',
  description: 'App para registro de treinos de musculação',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#9333ea',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
