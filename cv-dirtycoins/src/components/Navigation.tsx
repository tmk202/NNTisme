import React, { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleSound = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Gửi tín hiệu thông qua API iFrame ẩn của Youtube để điều khiển nhạc
      if (isPlaying) {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } else {
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      {/* Nhúng Youtube Ẩn thay vì dùng file .mp3 thông thường */}
      <iframe
        ref={iframeRef}
        src="https://www.youtube.com/embed/5VyMEZltLmk?enablejsapi=1&loop=1&playlist=5VyMEZltLmk"
        allow="autoplay"
        className="hidden"
      />

      <nav className="fixed inset-0 z-50 pointer-events-none p-6 mix-blend-difference text-white">
        {/* Top Left: Logo & Sound */}
        <div className="absolute top-6 left-6 pointer-events-auto flex items-center gap-6">
          <img src="/logo.png" alt="Logo" className="h-8 md:h-12 w-auto filter invert" />
          <button 
            onClick={toggleSound}
            className="flex items-center gap-2 text-xs md:text-sm font-roboto tracking-widest opacity-80 hover:opacity-100 transition-opacity"
          >
            {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>BGM {isPlaying ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Top Right: Links */}
        <div className="absolute top-6 right-6 pointer-events-auto flex gap-8 text-sm md:text-base font-roboto">
          <a href="#" className="hover:opacity-50 transition-opacity">COLLECTIONS</a>
          <a href="#" className="hover:opacity-50 transition-opacity">STORY</a>
          <a href="#" className="hover:opacity-50 transition-opacity underline decoration-1 underline-offset-4">SHOP</a>
        </div>

        {/* Bottom Left: Socials */}
        <div className="absolute bottom-6 left-6 pointer-events-auto flex flex-col gap-2 text-xs md:text-sm font-roboto opacity-70">
          <a href="#" className="hover:opacity-100 transition-opacity">INSTAGRAM</a>
          <a href="#" className="hover:opacity-100 transition-opacity">FACEBOOK</a>
          <a href="#" className="hover:opacity-100 transition-opacity">YOUTUBE</a>
        </div>

        {/* Bottom Right: Info */}
        <div className="absolute bottom-6 right-6 pointer-events-auto text-xs md:text-sm font-roboto opacity-70 text-right">
          <p>© 2026 HNBMG</p>
          <p>VIETNAM / WORLDWIDE</p>
        </div>
      </nav>

      {/* Decorative corners */}
      <div className="fixed inset-0 z-40 pointer-events-none mix-blend-difference text-white">
        <div className="absolute top-0 left-0 w-[40px] h-[1px] bg-white opacity-20"></div>
        <div className="absolute top-0 left-0 h-[40px] w-[1px] bg-white opacity-20"></div>

        <div className="absolute top-0 right-0 w-[40px] h-[1px] bg-white opacity-20"></div>
        <div className="absolute top-0 right-0 h-[40px] w-[1px] bg-white opacity-20"></div>

        <div className="absolute bottom-0 left-0 w-[40px] h-[1px] bg-white opacity-20"></div>
        <div className="absolute bottom-0 left-0 h-[40px] w-[1px] bg-white opacity-20"></div>

        <div className="absolute bottom-0 right-0 w-[40px] h-[1px] bg-white opacity-20"></div>
        <div className="absolute bottom-0 right-0 h-[40px] w-[1px] bg-white opacity-20"></div>
      </div>
    </>
  );
};

export default Navigation;
