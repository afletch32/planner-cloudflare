export function diffKeys(next, prev) {
  const out = {};
  const keys = new Set([...Object.keys(next || {}), ...Object.keys(prev || {})]);
  keys.forEach(key => {
    if (JSON.stringify(next[key]) !== JSON.stringify(prev[key])) {
      out[key] = next[key];
    }
  });
  return out;
}

export function pick(obj, keys) {
  const out = {};
  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      out[key] = obj[key];
    }
  });
  return out;
}
