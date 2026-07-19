const turnAudio = new Audio(`${import.meta.env.BASE_URL}sounds/turn.mp3`);
const solvedAudio = new Audio(`${import.meta.env.BASE_URL}sounds/solved.mp3`);

export function playTurnSound() {
  const instance = turnAudio.cloneNode(true) as HTMLAudioElement;
  instance.play().catch(() => {});
}

export function playSolvedSound() {
  const instance = solvedAudio.cloneNode(true) as HTMLAudioElement;
  instance.play().catch(() => {});
}
