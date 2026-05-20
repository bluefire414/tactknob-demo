// Clamp value between min and max
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// Map value from one range to another
function mapRange(val, inMin, inMax, outMin, outMax) {
  return ((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// Round to decimal places
function roundTo(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// Haptic feedback (Android)
function vibrate(ms = 8) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

// Compute angle in degrees from center point to pointer position
// 0° = top, increases clockwise
function angleTo(cx, cy, px, py) {
  return Math.atan2(py - cy, px - cx) * (180 / Math.PI) + 90;
}

// Normalize angle to [-180, 180]
function normalizeAngle(angle) {
  let a = angle % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

// SVG arc path helper
// cx, cy: center; r: radius; startAngle, endAngle: degrees (0=top, cw)
function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = (endAngle - startAngle + 360) % 360 > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
