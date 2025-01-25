import React, { useRef, useState, useEffect } from 'react';

const CurveCanvas = ({ 
  curve,
  onCurveChange,
  onStartDrag,
  minRange = -1.2,
  maxRange = 1.2,
  extendedRange = 0.2,
  margin = 20 
}) => {
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
    onStartDrag();
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
    onStartDrag();
  };

  const handleMouseMove = (e) => {
    if (!dragging || !svgRef.current || !initialCurve) return;
  
    const rect = svgRef.current.getBoundingClientRect();
    const viewBox = svgRef.current.viewBox.baseVal;
    const currentX = (e.clientX - rect.left) * (viewBox.width / rect.width);
    const currentY = (e.clientY - rect.top) * (viewBox.height / rect.height);
    
    let newCurve;
    if (dragging === 'path') {
      const deltaX = (currentX - dragStart.x) / graphWidth;
      const deltaY = -(currentY - dragStart.y) / graphHeight;
      
      newCurve = {
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
      };
    } else {
      const newPoint = fromSvgCoords(currentX, currentY);
      const initialPoint = initialCurve[dragging];
      
      if (e.shiftKey) {
        const deltaX = Math.abs(newPoint.x - initialPoint.x);
        const deltaY = Math.abs(newPoint.y - initialPoint.y);
        
        if (deltaX > deltaY) {
          newPoint.y = initialPoint.y;
        } else {
          newPoint.x = initialPoint.x;
        }
      }

      if (dragging === 'p1' || dragging === 'p2') {
        newPoint.x = Math.max(minRange, Math.min(maxRange, newPoint.x));
        newPoint.y = Math.max(minRange, Math.min(maxRange, newPoint.y));
      } else {
        newPoint.x = Math.max(0, Math.min(1, newPoint.x));
        newPoint.y = Math.max(0, Math.min(1, newPoint.y));
      }

      newCurve = {
        ...curve,
        [dragging]: newPoint
      };
    }
    
    onCurveChange(newCurve);
  };

  const handleMouseUp = () => {
    setDragging(null);
    setInitialCurve(null);
  };

  const start = toSvgCoords(curve.start);
  const end = toSvgCoords(curve.end);
  const p1 = toSvgCoords(curve.p1);
  const p2 = toSvgCoords(curve.p2);

  const path = `M ${start.x},${start.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${end.x},${end.y}`;
  
  return (
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
  );
};

export default CurveCanvas;