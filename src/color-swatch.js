// ColorSwatch.jsx
import React from 'react';

const ColorSwatch = ({ color }) => {
  const { r, g, b } = color;
  const rgbString = `rgb(${r}, ${g}, ${b})`;

  return (
    <div className="flex-1 min-w-0">
      <div
        className="h-20 w-full"
        style={{ backgroundColor: rgbString }}
      />
      <div className="text-xs p-1 text-left overflow-hidden">
        {`R: ${r} G: ${g} B: ${b}`}
      </div>
    </div>
  );
};

export default ColorSwatch;