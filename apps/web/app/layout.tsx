import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './home.css';
import './styles.css';
import './workspace.css';

export const metadata: Metadata = {
  title: 'Hirearchy — Evidence over impressions',
  description: 'Real-work assessments for clearer human hiring decisions.',
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
