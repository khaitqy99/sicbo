import React, { useEffect, useState, useRef } from 'react';

interface DiceProps {
  value: number;
  rollId: number; // Used to trigger new rolls even if value is same
  continuousRoll?: boolean; // Keep rolling continuously
}

const Dice: React.FC<DiceProps> = ({ value, rollId, continuousRoll = false }) => {
  // We use a fixed internal size for 3D math (100px), then scale via CSS
  const size = 100; 
  const translateZ = size / 2;
  
  // Track rotation state
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Continuous rolling effect
  useEffect(() => {
    if (continuousRoll) {
      // Start continuous rolling
      intervalRef.current = setInterval(() => {
        const currentX = rotationRef.current.x;
        const currentY = rotationRef.current.y;
        
        // Add continuous spins
        const newX = currentX + 360 * 2; // 2 full rotations
        const newY = currentY + 360 * 2;
        
        const finalRotation = { x: newX, y: newY, z: 0 };
        setRotation(finalRotation);
        rotationRef.current = finalRotation;
      }, 1000); // Every 1 second, add more rotation
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [continuousRoll]);

  // Normal roll to specific value
  useEffect(() => {
    if (continuousRoll) return; // Don't interfere with continuous roll
    
    // Logic to spin to the target face
    // 1. Calculate the base rotation needed for the target face
    let targetX = 0;
    let targetY = 0;
    
    // Standard mapping (assuming initial front is 1)
    switch (value) {
      case 1: targetX = 0; targetY = 0; break;       // Front
      case 6: targetX = 180; targetY = 0; break;     // Back
      case 2: targetX = 0; targetY = -90; break;     // Right (Face 2 visual is Left in CSS -90Y)
      case 5: targetX = 0; targetY = 90; break;      // Left (Face 5 visual is Right in CSS +90Y)
      case 3: targetX = -90; targetY = 0; break;     // Top (Face 3 visual is Top -90X)
      case 4: targetX = 90; targetY = 0; break;      // Bottom (Face 4 visual is Bottom +90X)
    }

    // 2. Add extra random full spins to the CURRENT rotation to simulate a long roll
    const currentX = rotationRef.current.x;
    const currentY = rotationRef.current.y;
    
    // Randomize spins (High number for 2 seconds of fast spinning)
    // Use ease-linear CSS to ensure it doesn't slow down.
    const spinsX = 8 + Math.floor(Math.random() * 8); 
    const spinsY = 8 + Math.floor(Math.random() * 8);
    
    // Calculate new target. 
    // Logic: Take current, add spins, add target offset, remove previous modulo drift
    // Ideally: Base + Spins + Target.
    const newX = currentX + (spinsX * 360) + (targetX - (currentX % 360));
    const newY = currentY + (spinsY * 360) + (targetY - (currentY % 360));
    
    const finalRotation = { x: newX, y: newY, z: 0 };
    setRotation(finalRotation);
    rotationRef.current = finalRotation;
    
  }, [rollId, value, continuousRoll]); // Trigger whenever rollId changes

  // Unified Dot Component (All Red, All Same Size)
  const Dot = ({ style }: { style: any }) => (
    <div className="w-[18%] h-[18%] bg-red-600 rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.4)] absolute" style={style} />
  );

  // Grid positions
  const center = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const tl = { top: '15%', left: '15%' };
  const tr = { top: '15%', right: '15%' };
  const bl = { bottom: '15%', left: '15%' };
  const br = { bottom: '15%', right: '15%' };
  const ml = { top: '50%', left: '15%', transform: 'translate(0, -50%)' };
  const mr = { top: '50%', right: '15%', transform: 'translate(0, -50%)' };

  return (
    <div className="scene relative" style={{ width: size, height: size }}>
      <div
        className="cube w-full h-full relative preserve-3d transition-transform ease-linear"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transitionDuration: '2100ms' // Slightly longer than the 2000ms wait so it's still moving when covered
        }}
      >
        {/* Face 1 (Front) */}
        <div className="dice-face" style={{ transform: `rotateY(0deg) translateZ(${translateZ}px)` }}>
           <Dot style={center} />
        </div>

        {/* Face 5 (Right in CSS +90Y) */}
        <div className="dice-face" style={{ transform: `rotateY(90deg) translateZ(${translateZ}px)` }}>
           <Dot style={tl} />
           <Dot style={tr} />
           <Dot style={center} />
           <Dot style={bl} />
           <Dot style={br} />
        </div>

        {/* Face 2 (Left in CSS -90Y) */}
        <div className="dice-face" style={{ transform: `rotateY(-90deg) translateZ(${translateZ}px)` }}>
           <Dot style={tr} />
           <Dot style={bl} />
        </div>

        {/* Face 3 (Top in CSS -90X) */}
        <div className="dice-face" style={{ transform: `rotateX(90deg) translateZ(${translateZ}px)` }}>
           <Dot style={tl} />
           <Dot style={center} />
           <Dot style={br} />
        </div>

        {/* Face 4 (Bottom in CSS +90X) */}
        <div className="dice-face" style={{ transform: `rotateX(-90deg) translateZ(${translateZ}px)` }}>
           <Dot style={tl} />
           <Dot style={tr} />
           <Dot style={bl} />
           <Dot style={br} />
        </div>

        {/* Face 6 (Back in CSS 180Y) */}
        <div className="dice-face" style={{ transform: `rotateY(180deg) translateZ(${translateZ}px)` }}>
           <Dot style={tl} />
           <Dot style={tr} />
           <Dot style={ml} />
           <Dot style={mr} />
           <Dot style={bl} />
           <Dot style={br} />
        </div>
      </div>
    </div>
  );
};

export default Dice;