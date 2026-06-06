import type { PropsWithChildren } from 'react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

export const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-[1500px] flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <Footer />
        </div>
      </div>
    </div>
  );
};
