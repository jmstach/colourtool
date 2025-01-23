// CurveEditor.jsx
import React, { useRef, useState, useEffect } from 'react';

const CurveEditor = ({ type, curve, onChange }) => {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  // Extended range for control points
  const extendedRange = 0.2; // Additional range beyond [-1, 1]
  const minRange = -1.2;
  const maxRange = 1.2;
  const margin = 20;
  const graphWidth = dimensions.width - 2 * margin;
  const graphHeight = dimensions.height - 2 * margin;
  const totalWidth = graphWidth * (1 + 2 * extendedRange);
  const totalHeight = graphHeight * (1 + 2 * extendedRange);
  const viewBoxMargin = margin + (extendedRange * graphWidth);

  const toSvgCoords = (point) => ({
    x: point.x * graphWidth + viewBoxMargin,
    y: (1 - point.y) * graphHeight + viewBoxMargin
  });

  const fromSvgCoords = (x, y) => {
    const point = {
      x: (x - viewBoxMargin) / graphWidth,
      y: 1 - (y - viewBoxMargin) / graphHeight
    };
    
    // Only clamp start and end points to [0,1]
    if (dragging === 'start' || dragging === 'end') {
      point.x = Math.max(0, Math.min(1, point.x));
      point.y = Math.max(0, Math.min(1, point.y));
    } else {
      // Allow control points to go far beyond bounds
      point.x = Math.max(minRange, Math.min(maxRange, point.x));
      point.y = Math.max(minRange, Math.min(maxRange, point.y));
    }
    
    return point;
  };

  const handleMouseDown = (point) => {
    setDragging(point);
  };

  const handleMouseMove = (e) => {
    if (!dragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    
    // Convert mouse coordinates to SVG viewBox coordinates
    const x = (e.clientX - rect.left) * (viewBox.width / rect.width);
    const y = (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    const newPoint = fromSvgCoords(x, y);

    onChange({
      ...curve,
      [dragging]: newPoint
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const resetCurve = () => {
    // Keep start and end points, create straight line between them
    const { start, end } = curve;
    
    // Calculate control points for a straight line
    // Place them at one-third and two-thirds along the line
    const p1 = {
      x: start.x + (end.x - start.x) * 0.33,
      y: start.y + (end.y - start.y) * 0.33
    };
    
    const p2 = {
      x: start.x + (end.x - start.x) * 0.66,
      y: start.y + (end.y - start.y) * 0.66
    };

    onChange({
      start,
      p1,
      p2,
      end
    });
  };

  const start = toSvgCoords(curve.start);
  const end = toSvgCoords(curve.end);
  const p1 = toSvgCoords(curve.p1);
  const p2 = toSvgCoords(curve.p2);

  const path = `M ${start.x},${start.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${end.x},${end.y}`;
  
  // Calculate extended graph boundaries for visual reference
  const graphLeft = viewBoxMargin;
  const graphRight = viewBoxMargin + graphWidth;
  const graphTop = viewBoxMargin;
  const graphBottom = viewBoxMargin + graphHeight;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold capitalize">{type}</h2>
      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full aspect-square bg-gray-100 rounded"
          viewBox={`0 0 ${totalWidth + 2 * margin} ${totalHeight + 2 * margin}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Extended area guides */}
          <rect
            x={margin}
            y={margin}
            width={totalWidth}
            height={totalHeight}
            fill="#f8f8f8"
            stroke="#eee"
          />
          
          {/* Main graph area */}
          <rect
            x={graphLeft}
            y={graphTop}
            width={graphWidth}
            height={graphHeight}
            fill="#fff"
            stroke="#ddd"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          
          <path
            d={path}
            fill="none"
            stroke="black"
            strokeWidth="2"
          />
          
          {/* Control points */}
          <circle
            cx={start.x}
            cy={start.y}
            r="6"
            fill="green"
            cursor="pointer"
            onMouseDown={() => handleMouseDown('start')}
          />
          <circle
            cx={p1.x}
            cy={p1.y}
            r="6"
            fill="blue"
            cursor="pointer"
            onMouseDown={() => handleMouseDown('p1')}
          />
          <circle
            cx={p2.x}
            cy={p2.y}
            r="6"
            fill="red"
            cursor="pointer"
            onMouseDown={() => handleMouseDown('p2')}
          />
          <circle
            cx={end.x}
            cy={end.y}
            r="6"
            fill="purple"
            cursor="pointer"
            onMouseDown={() => handleMouseDown('end')}
          />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <label className="block text-sm font-medium">Start Point</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={curve.start.x.toFixed(2)}
              onChange={(e) => onChange({ ...curve, start: { ...curve.start, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={curve.start.y.toFixed(2)}
              onChange={(e) => onChange({ ...curve, start: { ...curve.start, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Control Point 1</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={curve.p1.x.toFixed(2)}
              onChange={(e) => onChange({ ...curve, p1: { ...curve.p1, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={-extendedRange}
              max={1 + extendedRange}
              step="0.01"
              value={curve.p1.y.toFixed(2)}
              onChange={(e) => onChange({ ...curve, p1: { ...curve.p1, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Control Point 2</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={-extendedRange}
              max={1 + extendedRange}
              step="0.01"
              value={curve.p2.x.toFixed(2)}
              onChange={(e) => onChange({ ...curve, p2: { ...curve.p2, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={-extendedRange}
              max={1 + extendedRange}
              step="0.01"
              value={curve.p2.y.toFixed(2)}
              onChange={(e) => onChange({ ...curve, p2: { ...curve.p2, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">End Point</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={curve.end.x.toFixed(2)}
              onChange={(e) => onChange({ ...curve, end: { ...curve.end, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={curve.end.y.toFixed(2)}
              onChange={(e) => onChange({ ...curve, end: { ...curve.end, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <button
          onClick={resetCurve}
          className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default CurveEditor;