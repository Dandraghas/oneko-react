import React, { useEffect, useRef, useState } from "react";
import nekoFile from "./neko.gif";

const Oneko: React.FC = () => {
  const nekoRef = useRef<HTMLDivElement | null>(null);
  const [nekoPos, setNekoPos] = useState({ x: 32, y: 32 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [frameCount, setFrameCount] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [idleAnimation, setIdleAnimation] = useState<
    keyof typeof spriteSets | null
  >(null);
  const [idleAnimationFrame, setIdleAnimationFrame] = useState(0);

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

  useEffect(() => {
    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isReducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);

    const onAnimationFrame = () => {
      setFrameCount((prevFrameCount) => prevFrameCount + 1);
      window.requestAnimationFrame(onAnimationFrame);
    };

    window.requestAnimationFrame(onAnimationFrame);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const diffX = nekoPos.x - mousePos.x;
    const diffY = nekoPos.y - mousePos.y;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    setIdleAnimation(null);
    setIdleAnimationFrame(0);

    if (idleTime > 1) {
      setSprite("alert", 0);
      setIdleTime(Math.min(idleTime, 7));
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

    const newNekoPosX = Math.min(
      Math.max(16, nekoPos.x - (diffX / distance) * nekoSpeed),
      window.innerWidth - 16
    );
    const newNekoPosY = Math.min(
      Math.max(16, nekoPos.y - (diffY / distance) * nekoSpeed),
      window.innerHeight - 16
    );

    setNekoPos({ x: newNekoPosX, y: newNekoPosY });
  }, [frameCount, idleTime, mousePos, nekoPos]);

  const setSprite = (name: keyof typeof spriteSets, frame: number) => {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    if (nekoRef.current) {
      nekoRef.current.style.backgroundPosition = `${sprite[0] * 32}px ${
        sprite[1] * 32
      }px`;
    }
  };

  const resetIdleAnimation = () => {
    setIdleAnimation(null);
    setIdleAnimationFrame(0);
  };

  const idle = () => {
    setIdleTime((prevIdleTime) => prevIdleTime + 1);

    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      idleAnimation === null
    ) {
      const availableIdleAnimations: Array<keyof typeof spriteSets> = [
        "sleeping",
        "scratchSelf",
      ];

      if (nekoPos.x < 32) availableIdleAnimations.push("scratchWallW");
      if (nekoPos.y < 32) availableIdleAnimations.push("scratchWallN");
      if (nekoPos.x > window.innerWidth - 32)
        availableIdleAnimations.push("scratchWallE");
      if (nekoPos.y > window.innerHeight - 32)
        availableIdleAnimations.push("scratchWallS");

      setIdleAnimation(
        availableIdleAnimations[
          Math.floor(Math.random() * availableIdleAnimations.length)
        ]
      );
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
    setIdleAnimationFrame(
      (prevIdleAnimationFrame) => prevIdleAnimationFrame + 1
    );
  };

  return (
    <div
      ref={nekoRef}
      id="oneko"
      aria-hidden="true"
      style={{
        width: "32px",
        height: "32px",
        position: "fixed",
        pointerEvents: "none",
        imageRendering: "pixelated",
        left: `${nekoPos.x - 16}px`,
        top: `${nekoPos.y - 16}px`,
        zIndex: 2147483647,
        backgroundImage: `url(${nekoFile})`,
      }}
    />
  );
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

export default Oneko;
