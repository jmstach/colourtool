// App.jsx
import './index.css';

import React, { useState, useCallback } from 'react';
import CurveEditor from './curve-editor.js';
import ColourPreview from './colour-preview.js';
// import ColorSwatch from './color-swatch.js';


const rgbToHsb = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h, s;
  const v = max;

  if (delta === 0) {
    h = 0;
    s = 0;
  } else {
    s = delta / max;
    if (max === r) {
      h = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h /= 6;
  }

  return { h, s, v };
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const App = () => {
  const [curves, setCurves] = useState({
    hue: { 
      start: { x: 0, y: 0 },
      p1: { x: 0.33, y: 0.33 }, 
      p2: { x: 0.66, y: 0.66 },
      end: { x: 1, y: 1 }
    },
    saturation: { 
      start: { x: 0, y: 0 },
      p1: { x: 0.33, y: 0.33 }, 
      p2: { x: 0.66, y: 0.66 },
      end: { x: 1, y: 1 }
    },
    brightness: { 
      start: { x: 0, y: 0 },
      p1: { x: 0.33, y: 0.33 }, 
      p2: { x: 0.66, y: 0.66 },
      end: { x: 1, y: 1 }
    }
  });

  const [startColor, setStartColor] = useState('#000000');
  const [endColor, setEndColor] = useState('#ff0000');
  const [numStops, setNumStops] = useState(10);

  const hsbToRgb = (h, s, v) => {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = 0; g = 0; b = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const handleCurveChange = useCallback((type, newCurve) => {
    setCurves(prev => {
      const newCurves = {
        ...prev,
        [type]: newCurve
      };

      // Update color pickers based on start and end points
      const startHsb = {
        h: newCurves.hue.start.y,
        s: newCurves.saturation.start.y,
        v: newCurves.brightness.start.y
      };

      const endHsb = {
        h: newCurves.hue.end.y,
        s: newCurves.saturation.end.y,
        v: newCurves.brightness.end.y
      };

      const startRgb = hsbToRgb(startHsb.h, startHsb.s, startHsb.v);
      const endRgb = hsbToRgb(endHsb.h, endHsb.s, endHsb.v);

      setStartColor(rgbToHex(startRgb.r, startRgb.g, startRgb.b));
      setEndColor(rgbToHex(endRgb.r, endRgb.g, endRgb.b));

      return newCurves;
    });
  }, []);

  const handleColorChange = (isStart, hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
    
    if (isStart) {
      setStartColor(hex);
      setCurves(prev => ({
        ...prev,
        hue: { ...prev.hue, start: { ...prev.hue.start, y: hsb.h } },
        saturation: { ...prev.saturation, start: { ...prev.saturation.start, y: hsb.s } },
        brightness: { ...prev.brightness, start: { ...prev.brightness.start, y: hsb.v } }
      }));
    } else {
      setEndColor(hex);
      setCurves(prev => ({
        ...prev,
        hue: { ...prev.hue, end: { ...prev.hue.end, y: hsb.h } },
        saturation: { ...prev.saturation, end: { ...prev.saturation.end, y: hsb.s } },
        brightness: { ...prev.brightness, end: { ...prev.brightness.end, y: hsb.v } }
      }));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Start color:</label>
            <input
              type="color"
              value={startColor}
              onChange={(e) => handleColorChange(true, e.target.value)}
              className="w-20 h-8 border border-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">End color:</label>
            <input
              type="color"
              value={endColor}
              onChange={(e) => handleColorChange(false, e.target.value)}
              className="w-20 h-8 border border-black"
            />
          </div>
        </div>

        <ColourPreview
  curves={curves}
  numStops={numStops}
  onNumStopsChange={setNumStops}
  startColor={startColor}
  endColor={endColor}
/>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CurveEditor
            type="hue"
            curve={curves.hue}
            onChange={(newCurve) => handleCurveChange('hue', newCurve)}
          />
          <CurveEditor
            type="saturation"
            curve={curves.saturation}
            onChange={(newCurve) => handleCurveChange('saturation', newCurve)}
          />
          <CurveEditor
            type="brightness"
            curve={curves.brightness}
            onChange={(newCurve) => handleCurveChange('brightness', newCurve)}
          />
        </div>
        
      </div>
    </div>
  );
};

export default App;