import React, { useRef } from 'react';
import CurveCanvas from './curve-canvas';
import CurveControls from './curve-controls';

const CurveEditor = ({ type = 'curve', curve, onChange = () => {} }) => {
  const dragStartCurve = useRef(null);

  const handleStartDrag = () => {
    dragStartCurve.current = {...curve};
  };

  const handleCurveChange = (newCurve) => {
    onChange(newCurve, dragStartCurve.current);
  };

  const handleMouseUp = () => {
    dragStartCurve.current = null;
  };

  const handleReset = () => {
    const { start, end } = curve;
    const p1 = {
      x: start.x + (end.x - start.x) * 0.33,
      y: start.y + (end.y - start.y) * 0.33
    };
    const p2 = {
      x: start.x + (end.x - start.x) * 0.66,
      y: start.y + (end.y - start.y) * 0.66
    };
    onChange({ start, p1, p2, end }, { start, p1, p2, end });
  };

  return (
    <div className="flex flex-col gap-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <h2 className="text-lg font-semibold capitalize">{type}</h2>
      <CurveCanvas 
        curve={curve}
        onCurveChange={handleCurveChange}
        onStartDrag={handleStartDrag}
      />
      <CurveControls
        curve={curve}
        onCurveChange={(newCurve) => onChange(newCurve)}
        onReset={handleReset}
      />
    </div>
  );
};

export default CurveEditor;