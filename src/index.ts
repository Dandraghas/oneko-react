import React, { useEffect, useRef } from "react";
import nekoFile from "./neko.gif";

const oneko: React.FC = () => {
  const nekoRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isReducedMotion) return;

    const nekoEl = document.createElement("div");
    nekoRef.current = nekoEl;

    let nekoPosX = 32;
    let nekoPosY = 32;

    let mousePosX = 0;
    let mousePosY = 0;

    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation: keyof typeof spriteSets | null = null;
    let idleAnimationFrame = 0;

    const nekoSpeed = 10;
    const spriteSets = {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
      scratchSelf: [
        [-5, 0],
        [-6, 0],
        [-7, 0],
      ],
      scratchWallN: [
        [0, 0],
        [0, -1],
      ],
      scratchWallS: [
        [-7, -1],
        [-6, -2],
      ],
      scratchWallE: [
        [-2, -2],
        [-2, -3],
      ],
      scratchWallW: [
        [-4, 0],
        [-4, -1],
      ],
      tired: [[-3, -2]],
      sleeping: [
        [-2, 0],
        [-2, -1],
      ],
      N: [
        [-1, -2],
        [-1, -3],
      ],
      NE: [
        [0, -2],
        [0, -3],
      ],
      E: [
        [-3, 0],
        [-3, -1],
      ],
      SE: [
        [-5, -1],
        [-5, -2],
      ],
      S: [
        [-6, -3],
        [-7, -2],
      ],
      SW: [
        [-5, -3],
        [-6, -1],
      ],
      W: [
        [-4, -2],
        [-4, -3],
      ],
      NW: [
        [-1, 0],
        [-1, -1],
      ],
    };

    const init = (): void => {
      nekoEl.id = "oneko";
      nekoEl.ariaHidden = "true";
      nekoEl.style.width = "32px";
      nekoEl.style.height = "32px";
      nekoEl.style.position = "fixed";
      nekoEl.style.pointerEvents = "none";
      nekoEl.style.imageRendering = "pixelated";
      nekoEl.style.left = `${nekoPosX - 16}px`;
      nekoEl.style.top = `${nekoPosY - 16}px`;
      nekoEl.style.zIndex = "2147483647";

      nekoEl.style.backgroundImage = `url(${nekoFile})`;

      document.body.appendChild(nekoEl);

      document.addEventListener("mousemove", (event: MouseEvent) => {
        mousePosX = event.clientX;
        mousePosY = event.clientY;
      });

      window.requestAnimationFrame(onAnimationFrame);
    };

    let lastFrameTimestamp: number | undefined;

    const onAnimationFrame = (timestamp: number): void => {
      if (!nekoEl.isConnected) return;

      if (!lastFrameTimestamp) {
        lastFrameTimestamp = timestamp;
      }

      if (timestamp - lastFrameTimestamp > 100) {
        lastFrameTimestamp = timestamp;
        frame();
      }

      window.requestAnimationFrame(onAnimationFrame);
    };

    const setSprite = (name: keyof typeof spriteSets, frame: number): void => {
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${
        sprite[1] * 32
      }px`;
    };

    const resetIdleAnimation = (): void => {
      idleAnimation = null;
      idleAnimationFrame = 0;
    };

    const idle = (): void => {
      idleTime += 1;

      if (
        idleTime > 10 &&
        Math.floor(Math.random() * 200) === 0 &&
        idleAnimation === null
      ) {
        const availableIdleAnimations: Array<keyof typeof spriteSets> = [
          "sleeping",
          "scratchSelf",
        ];

        if (nekoPosX < 32) availableIdleAnimations.push("scratchWallW");
        if (nekoPosY < 32) availableIdleAnimations.push("scratchWallN");
        if (nekoPosX > window.innerWidth - 32)
          availableIdleAnimations.push("scratchWallE");
        if (nekoPosY > window.innerHeight - 32)
          availableIdleAnimations.push("scratchWallS");

        idleAnimation =
          availableIdleAnimations[
            Math.floor(Math.random() * availableIdleAnimations.length)
          ];
      }

      switch (idleAnimation) {
        case "sleeping":
          if (idleAnimationFrame < 8) {
            setSprite("tired", 0);
            break;
          }
          setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
          if (idleAnimationFrame > 192) {
            resetIdleAnimation();
          }
          break;
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnimation, idleAnimationFrame);
          if (idleAnimationFrame > 9) {
            resetIdleAnimation();
          }
          break;
        default:
          setSprite("idle", 0);
          return;
      }
      idleAnimationFrame += 1;
    };

    const frame = (): void => {
      frameCount += 1;
      const diffX = nekoPosX - mousePosX;
      const diffY = nekoPosY - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      if (distance < nekoSpeed || distance < 48) {
        idle();
        return;
      }

      idleAnimation = null;
      idleAnimationFrame = 0;

      if (idleTime > 1) {
        setSprite("alert", 0);
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        return;
      }

      let direction = "";
      direction += diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";

      if (isAllowedDirection(direction)) {
        setSprite(direction, frameCount);
      } else {
        console.warn("Invalid direction:", direction);
      }

      nekoPosX -= (diffX / distance) * nekoSpeed;
      nekoPosY -= (diffY / distance) * nekoSpeed;

      nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
      nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

      nekoEl.style.left = `${nekoPosX - 16}px`;
      nekoEl.style.top = `${nekoPosY - 16}px`;
    };

    init();

    return () => {
      if (nekoEl.isConnected) {
        nekoEl.remove();
      }
      document.removeEventListener("mousemove", () => {});
    };
  }, []);

  return null;
};

function isAllowedDirection(
  direction: string
): direction is
  | "idle"
  | "alert"
  | "scratchSelf"
  | "scratchWallN"
  | "scratchWallS"
  | "scratchWallE"
  | "scratchWallW"
  | "tired"
  | "sleeping"
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW" {
  return [
    "idle",
    "alert",
    "scratchSelf",
    "scratchWallN",
    "scratchWallS",
    "scratchWallE",
    "scratchWallW",
    "tired",
    "sleeping",
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ].includes(direction);
}

export default oneko;
