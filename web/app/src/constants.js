export const EXERCISE = {
  name: 'Elbow bend',
  target: 8,
  instruction: 'Sit upright with your arm out to the side. Bend and straighten slowly, 8 times.',
}
export function displayName(p) {
  const n = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
  return n || p?.email || ''
}