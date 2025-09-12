import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";

// Draw
const HandshakeAnimation = () => (
  <div className="animation-overlay">
    <svg
      className="handshake-svg"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M65,35 L75,45 M25,55 L35,65"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M40,60 Q50,70 60,60" strokeWidth="5" fill="none" />
      <path d="M40,40 Q50,30 60,40" strokeWidth="5" fill="none" />
      <style>{`
        .handshake-svg {
          animation: shake 0.8s infinite;
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
      `}</style>
    </svg>
    <p>It's a draw!</p>
  </div>
);

// Lose
const LoserMessage = () => (
  <div className="animation-overlay loser-message">
    <p>Don't be discouraged, try again!</p>
  </div>
);

function EndGameAnimation({ isGameOver, winner, username, isDraw }) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isGameOver) {
    return null;
  }

  const isWinner = winner === username;
  const isLoser = winner !== null && winner !== username && !isDraw;

  return (
    <>
      {isWinner && (
        // Win
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.1}
        />
      )}
      {isLoser && <LoserMessage />}
      {isDraw && <HandshakeAnimation />}
    </>
  );
}

export default EndGameAnimation;
