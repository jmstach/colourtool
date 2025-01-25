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
    case 'UPDATE':
      if (action.previousState) {
        return {
          past: [...state.past, action.previousState],
          present: action.payload,
          future: []
        };
      }
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: []
      };
    case 'UNDO':
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future]
      };
    case 'REDO':
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture
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
        e.preventDefault();
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

  const handleCurveChange = useCallback((type, newCurve, previousCurve) => {
    dispatch({
      type: 'UPDATE',
      payload: {
        ...state.present,
        curves: {
          ...curves,
          [type]: newCurve
        }
      },
      previousState: previousCurve ? {
        ...state.present,
        curves: {
          ...curves,
          [type]: previousCurve
        }
      } : undefined
    });
  }, [curves, state.present]);

  const handleColorChange = useCallback((isStart, hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
    
    dispatch({
      type: 'UPDATE',
      payload: {
        ...state.present,
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
  }, [curves, startColor, endColor, state.present]);

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
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={state.past.length === 0}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={state.future.length === 0}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Redo
            </button>
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
            onChange={(newCurve, previousCurve) => handleCurveChange('hue', newCurve, previousCurve)}
          />
          <CurveEditor
            type="saturation"
            curve={curves.saturation}
            onChange={(newCurve, previousCurve) => handleCurveChange('saturation', newCurve, previousCurve)}
          />
          <CurveEditor
            type="brightness"
            curve={curves.brightness}
            onChange={(newCurve, previousCurve) => handleCurveChange('brightness', newCurve, previousCurve)}
          />
        </div>
      </div>
    </div>
  );
};

export default App;