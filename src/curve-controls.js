import React from 'react';

const CurveControls = ({ 
  curve,
  onCurveChange,
  onReset,
  minRange = -1.2,
  maxRange = 1.2
}) => {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onReset}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        To line
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
              value={curve.start.x.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                start: { ...curve.start, x: parseFloat(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={curve.start.y.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                start: { ...curve.start, y: parseFloat(e.target.value) }
              })}
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
              value={curve.p1.x.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                p1: { ...curve.p1, x: parseFloat(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={curve.p1.y.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                p1: { ...curve.p1, y: parseFloat(e.target.value) }
              })}
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
              value={curve.p2.x.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                p2: { ...curve.p2, x: parseFloat(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min={minRange}
              max={maxRange}
              step="0.01"
              value={curve.p2.y.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                p2: { ...curve.p2, y: parseFloat(e.target.value) }
              })}
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
              value={curve.end.x.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                end: { ...curve.end, x: parseFloat(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={curve.end.y.toFixed(2)}
              onChange={(e) => onCurveChange({
                ...curve,
                end: { ...curve.end, y: parseFloat(e.target.value) }
              })}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurveControls;