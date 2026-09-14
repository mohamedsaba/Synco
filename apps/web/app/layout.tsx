import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './styles.css';
import './workspace.css';

export const metadata: Metadata = {
  title: 'Delimit by Synco',
  description: 'Real engineering work, preserved as inspectable evidence.',
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
