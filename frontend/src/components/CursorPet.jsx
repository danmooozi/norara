import { useState, useEffect, useRef } from 'react';

export default function CursorPet() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [moving, setMoving] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const targetRef = useRef({ x: -200, y: -200 });
  const posRef = useRef({ x: -200, y: -200 });
  const prevXRef = useRef(-200);
  const moveTimerRef = useRef(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (isTouchDevice) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX;
      setFlipped(newX < prevXRef.current);
      prevXRef.current = newX;
      targetRef.current = { x: newX, y: e.clientY };
      setMoving(true);
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => setMoving(false), 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(moveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let animId;
    const animate = () => {
      const target = targetRef.current;
      const prev = posRef.current;
      const next = {
        x: prev.x + (target.x - prev.x) * 0.13,
        y: prev.y + (target.y - prev.y) * 0.13,
      };
      posRef.current = next;
      setPos({ ...next });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className={`cursor-pet ${moving ? 'cursor-pet--moving' : 'cursor-pet--idle'}`}
      style={{
        left: `${pos.x + 14}px`,
        top: `${pos.y + 14}px`,
        transform: flipped ? 'scaleX(-1)' : 'scaleX(1)',
      }}
    >
      <div className="cursor-pet-duck" />
    </div>
  );
}
