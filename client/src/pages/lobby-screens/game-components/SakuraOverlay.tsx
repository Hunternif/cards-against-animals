import '@micman/sakura/dist/sakura.min.css';
import Sakura from '@micman/sakura';
import { useEffect } from 'react';

export function SakuraOverlay() {
  useEffect(() => {
    console.log('sakura time!');
    new Sakura('.sakura-screen', {
      delay: 600,
      minSize: 5,
      maxSize: 10,
      fallSpeed: 1.5,
      lifeTime: 3000,
    });
  }, []);

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
    >
    </div>
  );
}
