import { useEffect, useState } from "react";

interface OrbitalElement {
  id: number;
  orbitRadius: number;
  size: number;
  speed: number;
  angle: number;
  color: string;
}

const OrbitalElements = () => {
  const [elements, setElements] = useState<OrbitalElement[]>([]);

  useEffect(() => {
    const orbitalElements: OrbitalElement[] = [
      {
        id: 1,
        orbitRadius: 200,
        size: 4,
        speed: 0.005,
        angle: 0,
        color: 'hsl(var(--primary))'
      },
      {
        id: 2,
        orbitRadius: 300,
        size: 3,
        speed: 0.003,
        angle: Math.PI / 2,
        color: 'hsl(var(--accent))'
      },
      {
        id: 3,
        orbitRadius: 400,
        size: 2,
        speed: 0.002,
        angle: Math.PI,
        color: 'hsl(var(--cyber-purple))'
      }
    ];

    setElements(orbitalElements);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setElements(prev => 
        prev.map(element => ({
          ...element,
          angle: element.angle + element.speed
        }))
      );
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {elements.map(element => {
          const x = Math.cos(element.angle) * element.orbitRadius;
          const y = Math.sin(element.angle) * element.orbitRadius;
          
          return (
            <div key={element.id}>
              {/* Orbit path */}
              <div
                className="absolute rounded-full border border-primary/10"
                style={{
                  width: `${element.orbitRadius * 2}px`,
                  height: `${element.orbitRadius * 2}px`,
                  left: `${-element.orbitRadius}px`,
                  top: `${-element.orbitRadius}px`,
                }}
              />
              
              {/* Orbiting element */}
              <div
                className="absolute rounded-full cyber-glow"
                style={{
                  width: `${element.size}px`,
                  height: `${element.size}px`,
                  backgroundColor: element.color,
                  left: `${x - element.size / 2}px`,
                  top: `${y - element.size / 2}px`,
                  boxShadow: `0 0 10px ${element.color}`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrbitalElements;
