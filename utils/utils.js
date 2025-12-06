// Utility Functions, more can be added as needed

// Random Item Picker
export function getRandomItem(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
