import React, { useState, useCallback, useReducer, useEffect } from 'react';
import CurveEditor from './curve-editor.js';
import ColourPreview from './colour-preview.js';

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

const historyReducer = (state, action) => {
  switch (action.type) {
    case 'PUSH':
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: []
      };
    case 'UNDO':
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future]
      };
    case 'REDO':
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1)
      };
    default:
      return state;
  }
};

const App = () => {
  const [numStops, setNumStops] = useState(10);
  
  const initialState = {
    past: [],
    present: {
      curves: {
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
      },
      startColor: '#000000',
      endColor: '#ff0000'
    },
    future: []
  };

  const [state, dispatch] = useReducer(historyReducer, initialState);
  const { curves, startColor, endColor } = state.present;

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleCurveChange = useCallback((type, newCurve) => {
   // console.log('handleCurveChange:', type, newCurve);
    dispatch({
      type: 'PUSH',
      payload: {
        curves: {
          ...curves,
          [type]: newCurve
        },
        startColor,
        endColor
      }
    });
  }, [curves, startColor, endColor]);

  const handleColorChange = useCallback((isStart, hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
    
    dispatch({
      type: 'PUSH',
      payload: {
        curves: {
          ...curves,
          hue: { 
            ...curves.hue, 
            [isStart ? 'start' : 'end']: { 
              ...curves.hue[isStart ? 'start' : 'end'], 
              y: hsb.h 
            } 
          },
          saturation: { 
            ...curves.saturation, 
            [isStart ? 'start' : 'end']: { 
              ...curves.saturation[isStart ? 'start' : 'end'], 
              y: hsb.s 
            } 
          },
          brightness: { 
            ...curves.brightness, 
            [isStart ? 'start' : 'end']: { 
              ...curves.brightness[isStart ? 'start' : 'end'], 
              y: hsb.v 
            } 
          }
        },
        startColor: isStart ? hex : startColor,
        endColor: isStart ? endColor : hex
      }
    });
  }, [curves, startColor, endColor]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Start colour:</label>
              <input
                type="color"
                value={startColor}
                onChange={(e) => handleColorChange(true, e.target.value)}
                className="w-20 h-8 border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">End colour:</label>
              <input
                type="color"
                value={endColor}
                onChange={(e) => handleColorChange(false, e.target.value)}
                className="w-20 h-8 border border-gray-300 rounded"
              />
            </div>
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