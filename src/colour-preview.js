// ColourPreview.jsx
import React from 'react';

const bezierInterpolation = (start, p1, p2, end, t) => {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return (
    uuu * start +
    3 * uu * t * p1 +
    3 * u * tt * p2 +
    ttt * end
  );
};

const interpolateColor = (startRgb, endRgb, curves, t) => {
  const h = bezierInterpolation(
    curves.hue.start.y, 
    curves.hue.p1.y, 
    curves.hue.p2.y, 
    curves.hue.end.y, 
    t
  );

  const s = bezierInterpolation(
    curves.saturation.start.y, 
    curves.saturation.p1.y, 
    curves.saturation.p2.y, 
    curves.saturation.end.y, 
    t
  );

  const v = bezierInterpolation(
    curves.brightness.start.y, 
    curves.brightness.p1.y, 
    curves.brightness.p2.y, 
    curves.brightness.end.y, 
    t
  );

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t_ = v * (1 - (1 - f) * s);

  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t_; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t_; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t_; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const ColourPreview = ({ curves, numStops, onNumStopsChange, startColor, endColor }) => {
  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);
  
  const interpolatedColors = Array.from({ length: numStops }, (_, index) => {
    const t = index / (numStops - 1);
    return interpolateColor(startRgb, endRgb, curves, t);
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium">Number of color stops:</label>
        <input
          type="range"
          min="2"
          max="30"
          value={numStops}
          onChange={(e) => onNumStopsChange(Number(e.target.value))}
          className="mx-2"
        />
        <span className="text-sm">{numStops}</span>
        <button 
          onClick={() => {
            const svgWidth = numStops * 50;
            const svgHeight = 200;

            const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
  ${interpolatedColors.map((color, index) => `
    <rect 
      x="${index * 50}" 
      y="0" 
      width="50" 
      height="${svgHeight}" 
      fill="rgb(${color.r}, ${color.g}, ${color.b})"
    />`).join('')}
</svg>`;

            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'color_gradient.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Download SVG
        </button>
      </div>
      <div className="flex w-full overflow-x-auto">
        {interpolatedColors.map((color, index) => (
          <div key={index} className="flex-1 min-w-0">
            <div 
              className="h-20 w-full"
              style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
            />
            <div className="text-xs p-1 text-left overflow-hidden">
              <div>{color.r}</div>
              <div>{color.g}</div>
              <div>{color.b}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColourPreview;