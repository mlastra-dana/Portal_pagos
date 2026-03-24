import type { PropsWithChildren } from 'react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

export const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <Header />
        <main className="flex-1 py-8 sm:py-12">{children}</main>
        <Footer />
      </div>
    </div>
  );
};
