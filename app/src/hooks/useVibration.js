export function useVibration() {
  return (ms = 30) => {
    if ('vibrate' in navigator) navigator.vibrate(ms)
  }
}
