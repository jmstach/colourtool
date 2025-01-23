// ColourPreview.jsx
import React, { useMemo } from 'react';
import ColorSwatch from './color-swatch';

const ColourPreview = ({ curves, numStops, onNumStopsChange }) => {
  const calculateBezierPoint = (t, p0, p1, p2, p3) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
  };

  const calculateCurvePoint = (t, curve) => {
    const x = calculateBezierPoint(t, curve.start.x, curve.p1.x, curve.p2.x, curve.end.x);
    const y = calculateBezierPoint(t, curve.start.y, curve.p1.y, curve.p2.y, curve.end.y);
    return y; // We use the y value as this represents the actual value in the range [0,1]
  };

  const hsbToRgb = (h, s, b) => {
    h = ((h % 1) + 1) % 1; // Normalize hue to [0, 1]
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = b * (1 - s);
    const q = b * (1 - f * s);
    const t = b * (1 - (1 - f) * s);
    
    let r, g, b_;
    
    switch (i % 6) {
      case 0: r = b; g = t; b_ = p; break;
      case 1: r = q; g = b; b_ = p; break;
      case 2: r = p; g = b; b_ = t; break;
      case 3: r = p; g = q; b_ = b; break;
      case 4: r = t; g = p; b_ = b; break;
      case 5: r = b; g = p; b_ = q; break;
      default: r = 0; g = 0; b_ = 0;
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b_ * 255)
    };
  };

  const colors = useMemo(() => {
    return Array.from({ length: numStops }, (_, i) => {
      const t = i / (numStops - 1);
      
      // Use calculateCurvePoint to get the y-values which represent the actual HSB values
      const h = calculateCurvePoint(t, curves.hue);
      const s = calculateCurvePoint(t, curves.saturation);
      const b = calculateCurvePoint(t, curves.brightness);
      
      return hsbToRgb(h, s, b);
    });
  }, [curves, numStops]);

  const downloadSvg = () => {
    const width = numStops * 50;
    const height = 50;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        ${colors.map((color, i) => `
          <rect
            x="${i * (width / numStops)}"
            y="0"
            width="${width / numStops}"
            height="${height}"
            fill="rgb(${color.r}, ${color.g}, ${color.b})"
          />
        `).join('')}
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-gradient.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Number of stops:</label>
        <input
          type="number"
          min="5"
          max="30"
          value={numStops}
          onChange={(e) => onNumStopsChange(Math.max(5, Math.min(30, parseInt(e.target.value))))}
          className="w-20 px-2 py-1 border rounded"
        />
        <button
          onClick={downloadSvg}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Download SVG
        </button>
      </div>
      <div className="flex">
        {colors.map((color, i) => (
          <ColorSwatch key={i} color={color} />
        ))}
      </div>
    </div>
  );
};

export default ColourPreview;