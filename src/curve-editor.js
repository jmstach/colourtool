import React, { useRef, useState, useEffect } from 'react';

const defaultCurve = {
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
  p1: { x: 0.33, y: 0.33 },
  p2: { x: 0.66, y: 0.66 }
};

const CurveEditor = ({ type = 'curve', curve = defaultCurve, onChange = () => {} }) => {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCurve, setInitialCurve] = useState(null);

  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      setDimensions({ width, height });

      const observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      });

      observer.observe(svgRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const extendedRange = 0.2;
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
    
    if (dragging === 'start' || dragging === 'end') {
      point.x = Math.max(0, Math.min(1, point.x));
      point.y = Math.max(0, Math.min(1, point.y));
    } else {
      point.x = Math.max(minRange, Math.min(maxRange, point.x));
      point.y = Math.max(minRange, Math.min(maxRange, point.y));
    }
    
    return point;
  };

  const handleMouseDown = (point, e) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    const x = (e.clientX - rect.left) * (viewBox.width / rect.width);
    const y = (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    setDragStart({ x, y });
    setInitialCurve({ ...curve });
    setDragging(point);
  };

  const handlePathMouseDown = (e) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    const x = (e.clientX - rect.left) * (viewBox.width / rect.width);
    const y = (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    setDragStart({ x, y });
    setInitialCurve({ ...curve });
    setDragging('path');
  };

  const handleMouseMove = (e) => {
    if (!dragging || !svgRef.current || !initialCurve) return;

    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    const currentX = (e.clientX - rect.left) * (viewBox.width / rect.width);
    const currentY = (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    if (dragging === 'path') {
      const deltaX = (currentX - dragStart.x) / graphWidth;
      const deltaY = -(currentY - dragStart.y) / graphHeight;

      onChange({
        start: { 
          x: Math.max(0, Math.min(1, initialCurve.start.x + deltaX)),
          y: Math.max(0, Math.min(1, initialCurve.start.y + deltaY))
        },
        p1: {
          x: Math.max(minRange, Math.min(maxRange, initialCurve.p1.x + deltaX)),
          y: Math.max(minRange, Math.min(maxRange, initialCurve.p1.y + deltaY))
        },
        p2: {
          x: Math.max(minRange, Math.min(maxRange, initialCurve.p2.x + deltaX)),
          y: Math.max(minRange, Math.min(maxRange, initialCurve.p2.y + deltaY))
        },
        end: {
          x: Math.max(0, Math.min(1, initialCurve.end.x + deltaX)),
          y: Math.max(0, Math.min(1, initialCurve.end.y + deltaY))
        }
      });
    } else {
      const newPoint = fromSvgCoords(currentX, currentY);
      
      // If shift key is pressed, constrain movement
      if (e.shiftKey) {
        const originalPoint = curve[dragging];
        const isDraggingControlPoint = dragging === 'p1' || dragging === 'p2';
        
        if (Math.abs(newPoint.x - originalPoint.x) > Math.abs(newPoint.y - originalPoint.y)) {
          // Horizontal movement
          newPoint.y = isDraggingControlPoint 
            ? Math.max(minRange, Math.min(maxRange, originalPoint.y)) 
            : Math.max(0, Math.min(1, originalPoint.y));
        } else {
          // Vertical movement
          newPoint.x = isDraggingControlPoint 
            ? Math.max(minRange, Math.min(maxRange, originalPoint.x)) 
            : Math.max(0, Math.min(1, originalPoint.x));
        }
      }

      onChange({
        ...curve,
        [dragging]: newPoint
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setInitialCurve(null);
  };

  const resetCurve = () => {
    const { start, end } = curve;
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

  const currentCurve = {
    ...defaultCurve,
    ...curve
  };

  const start = toSvgCoords(currentCurve.start);
  const end = toSvgCoords(currentCurve.end);
  const p1 = toSvgCoords(currentCurve.p1);
  const p2 = toSvgCoords(currentCurve.p2);

  const path = `M ${start.x},${start.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${end.x},${end.y}`;
  
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold capitalize">{type}</h2>
      <div className="relative touch-none">
        <svg
          ref={svgRef}
          className="w-full aspect-square bg-gray-100 rounded"
          viewBox={`0 0 ${totalWidth + 2 * margin} ${totalHeight + 2 * margin}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <rect
            x={margin}
            y={margin}
            width={totalWidth}
            height={totalHeight}
            fill="#f8f8f8"
            stroke="#eee"
          />
          
          <rect
            x={viewBoxMargin}
            y={viewBoxMargin}
            width={graphWidth}
            height={graphHeight}
            fill="#fff"
            stroke="#ddd"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          <line 
            x1={start.x} 
            y1={start.y} 
            x2={p1.x} 
            y2={p1.y}
            stroke="#999"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line 
            x1={p2.x} 
            y1={p2.y} 
            x2={end.x} 
            y2={end.y}
            stroke="#999"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          
          <path
            d={path}
            fill="none"
            stroke="black"
            strokeWidth="2"
            cursor="move"
            onMouseDown={handlePathMouseDown}
            style={{ pointerEvents: 'stroke' }}
          />
          
          <circle
            cx={start.x}
            cy={start.y}
            r="6"
            fill="green"
            cursor="pointer"
            onMouseDown={(e) => handleMouseDown('start', e)}
          />
          <circle
            cx={p1.x}
            cy={p1.y}
            r="6"
            fill="blue"
            cursor="pointer"
            onMouseDown={(e) => handleMouseDown('p1', e)}
          />
          <circle
            cx={p2.x}
            cy={p2.y}
            r="6"
            fill="red"
            cursor="pointer"
            onMouseDown={(e) => handleMouseDown('p2', e)}
          />
          <circle
            cx={end.x}
            cy={end.y}
            r="6"
            fill="purple"
            cursor="pointer"
            onMouseDown={(e) => handleMouseDown('end', e)}
          />
        </svg>
      </div>

      <button
        onClick={resetCurve}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Reset
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Start point</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={currentCurve.start.x.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, start: { ...currentCurve.start, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={currentCurve.start.y.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, start: { ...currentCurve.start, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Control point 1</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={currentCurve.p1.x.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, p1: { ...currentCurve.p1, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={currentCurve.p1.y.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, p1: { ...currentCurve.p1, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Control point 2</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={currentCurve.p2.x.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, p2: { ...currentCurve.p2, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={currentCurve.p2.y.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, p2: { ...currentCurve.p2, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">End point</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={currentCurve.end.x.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, end: { ...currentCurve.end, x: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={currentCurve.end.y.toFixed(2)}
              onChange={(e) => onChange({ ...currentCurve, end: { ...currentCurve.end, y: parseFloat(e.target.value) } })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurveEditor;