import '@micman/sakura/dist/sakura.min.css';
import Sakura from '@micman/sakura';
import { useEffect, useState } from 'react';
import { useLocalSettings } from './LocalSettingsContext';

export function SakuraOverlay() {
  const [sakura, setSakura] = useState<Sakura | null>(null);
  const { settings } = useLocalSettings();

  useEffect(() => {
    if (sakura && !settings.enableParticles) {
      sakura.stop();
      setSakura(null);
    }
    if (!sakura && settings.enableParticles) {
      const newSakura = new Sakura('.sakura-screen', {
        delay: 600,
        minSize: 5,
        maxSize: 10,
        fallSpeed: 1.5,
      });
      setSakura(newSakura);
    }
  }, [settings.enableParticles]);

  return (
    <div
      className="sakura-screen"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
      }}
    ></div>
  );
}
