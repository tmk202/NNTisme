import React from 'react';
import Scene from './components/Scene';
import Navigation from './components/Navigation';

function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      {/* 3D Scene Background */}
      <Scene />

      {/* 4-Corner Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-40 py-[90px] pointer-events-none">
        <h1
          className="text-5xl sm:text-7xl md:text-8xl max-w-7xl text-center text-white"
          style={{
            fontFamily: 'var(--font-heading)',
            lineHeight: 0.95,
            letterSpacing: '-2.46px',
            fontWeight: 'normal',
            textTransform: 'none' // Override body uppercase for this specific title
          }}
        >
          {/* Make HNBMG great again */}
        </h1>
      </div>
    </main>
  );
}

export default App;
