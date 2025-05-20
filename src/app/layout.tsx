import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Visualisateur de diagrammes GANTT & PERT',
  description: 'Application pour créer et visualiser des diagrammes de GANTT et PERT à partir d\'un tableau de tâches',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-blue-600 mr-2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                  <path d="M8 18h.01"></path>
                  <path d="M12 18h.01"></path>
                  <path d="M16 18h.01"></path>
                </svg>
                <span className="font-bold text-xl">GANTT & PERT Visualizer</span>
              </div>
            </div>
          </div>
        </header>
        
        {children}
        
        <footer className="bg-white shadow-sm mt-10 py-6">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-600 text-sm">
              <p>&copy; {new Date().getFullYear()} GANTT & PERT Visualizer - Tous droits réservés</p>
              <p className="mt-1">Un outil moderne pour la gestion et la visualisation de projets</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}