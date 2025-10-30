export const playSound = () => {
  try {
    const audio = new Audio('/sounds/notify.mp3');
    audio.play().catch(() => {});
  } catch {}
};

export const vibrate = () => {
  try {
    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
  } catch {}
};
