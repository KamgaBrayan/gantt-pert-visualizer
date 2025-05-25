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
      <body className={`${inter.className} relative overflow-x-hidden`}>
        {/* Particules d'arrière-plan */}
        <div className="particles-bg">
          <div className="particle" style={{ top: '20%', left: '10%' }}></div>
          <div className="particle" style={{ top: '60%', left: '80%' }}></div>
          <div className="particle" style={{ top: '40%', left: '60%' }}></div>
          <div className="particle" style={{ top: '80%', left: '20%' }}></div>
          <div className="particle" style={{ top: '10%', left: '90%' }}></div>
          <div className="particle" style={{ top: '70%', left: '40%' }}></div>
        </div>

        {/* Header moderne */}
        <header className="relative z-50 glass-card border-b-0 animate-slide-down">
          <div className="container mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center group">
                {/* Logo avec effet holographique */}
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#6d38e0] to-[#198eb4] hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 drop-shadow-lg"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <circle cx="8" cy="14" r="1.5"></circle>
                    <circle cx="12" cy="14" r="1.5"></circle>
                    <circle cx="16" cy="14" r="1.5"></circle>
                    <circle cx="8" cy="18" r="1.5"></circle>
                    <circle cx="12" cy="18" r="1.5"></circle>
                  </svg>
                </div>
                
                <div className="ml-4">
                  <h1 className="font-bold text-2xl bg-gradient-to-r from-[#040642] to-[#6d38e0] bg-clip-text text-transparent">
                    TaskFlow Studio
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Visualizer with Gantt&Pert</p>
                </div>
              </div>

              {/* Navigation badge */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="px-4 py-2 bg-gradient-to-r from-[#6d38e0]/10 to-[#198eb4]/10 rounded-full border border-[#6d38e0]/20">
                  <span className="text-sm font-medium text-[#040642]"> Project Management</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Contenu principal */}
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
        
        {/* Footer moderne */}
        <footer className="relative z-50 glass-card border-t-0 mt-20 animate-fade-in">
          <div className="container mx-auto px-6 py-12">
            <div className="text-center space-y-6">
              {/* Logo footer */}
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6d38e0] to-[#198eb4] shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>

              {/* Texte du footer */}
              <div className="space-y-2">
                <p className="text-[#040642] font-semibold text-lg">
                  &copy; {new Date().getFullYear()} GANTT & PERT Visualizer Pro
                </p>
                <p className="text-gray-600 max-w-md mx-auto">
                  Un outil moderne et intuitif pour la gestion et la visualisation de projets complexes
                </p>
              </div>

              {/* Séparateur décoratif */}
              <div className="flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-full"></div>
              </div>

              {/* Badge de technologie */}
              <div className="flex justify-center space-x-4">
                <div className="px-3 py-1 bg-[#040642]/5 rounded-full">
                  <span className="text-xs font-medium text-[#040642]">Next.js</span>
                </div>
                <div className="px-3 py-1 bg-[#6d38e0]/10 rounded-full">
                  <span className="text-xs font-medium text-[#6d38e0]">TypeScript</span>
                </div>
                <div className="px-3 py-1 bg-[#198eb4]/10 rounded-full">
                  <span className="text-xs font-medium text-[#198eb4]">Tailwind</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}