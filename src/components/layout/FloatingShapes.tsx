import { useEffect, useState } from "react";

interface Shape {
  id: number;
  type: 'triangle' | 'square' | 'hexagon';
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
}

const FloatingShapes = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    const generateShapes = () => {
      const newShapes: Shape[] = [];
      for (let i = 0; i < 8; i++) {
        newShapes.push({
          id: i,
          type: (['triangle', 'square', 'hexagon'] as const)[Math.floor(Math.random() * 3)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 60 + 20,
          rotation: Math.random() * 360,
          duration: Math.random() * 20 + 15,
          delay: Math.random() * 5
        });
      }
      setShapes(newShapes);
    };

    generateShapes();
  }, []);

  const renderShape = (shape: Shape) => {
    const baseClasses = "absolute opacity-10 cyber-border";
    const animationStyle = {
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      width: `${shape.size}px`,
      height: `${shape.size}px`,
      transform: `rotate(${shape.rotation}deg)`,
      animation: `float ${shape.duration}s ease-in-out ${shape.delay}s infinite`
    };

    switch (shape.type) {
      case 'triangle':
        return (
          <div
            key={shape.id}
            className={baseClasses}
            style={{
              ...animationStyle,
              width: 0,
              height: 0,
              borderLeft: `${shape.size/2}px solid transparent`,
              borderRight: `${shape.size/2}px solid transparent`,
              borderBottom: `${shape.size}px solid hsl(var(--primary))`
            }}
          />
        );
      case 'square':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} bg-primary/20`}
            style={animationStyle}
          />
        );
      case 'hexagon':
        return (
          <div
            key={shape.id}
            className={baseClasses}
            style={animationStyle}
          >
            <svg
              width={shape.size}
              height={shape.size}
              viewBox="0 0 100 100"
              className="w-full h-full"
            >
              <polygon
                points="50,5 90,25 90,75 50,95 10,75 10,25"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                opacity="0.3"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {shapes.map(shape => renderShape(shape))}
    </div>
  );
};

export default FloatingShapes;
