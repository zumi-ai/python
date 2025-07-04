const numStars = 100;

for (let i = 0; i < numStars; i++) {
  const star = document.createElement("div");
  star.className = "star";

  // 랜덤 위치
  star.style.top = Math.random() * 100 + "vh";
  star.style.left = Math.random() * 100 + "vw";

  // 느린 깜빡임 (3~6초), 느린 이동 (30~50초)
  const blinkDuration = (Math.random() * 3 + 3).toFixed(2);  // 3~6초
  const moveDuration = (Math.random() * 20 + 30).toFixed(2); // 30~50초
  star.style.animationDuration = `${blinkDuration}s, ${moveDuration}s`;

  // 이동 방향 랜덤
  star.style.setProperty("--dx", (Math.random() * 20 - 10).toFixed(2));
  star.style.setProperty("--dy", (Math.random() * 20 - 10).toFixed(2));

  document.body.appendChild(star);
}
