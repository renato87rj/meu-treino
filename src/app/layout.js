import "./globals.css";

export const metadata = {
  title: 'Meus Treinos',
  description: 'App para registro de treinos de musculação',
  manifest: '/manifest.json',
  themeColor: '#9333ea',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
