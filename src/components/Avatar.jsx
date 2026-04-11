import { useEffect, useRef, useState } from "react";
import "./Avatar.css";

const EMOTIONS = {
  happy: {
    eyebrowAngle: -15,
    eyeScale: 1.1,
    mouthCurve: 0.4,
    mouthWidth: 0.7,
    blush: true,
    pupilY: 0,
    headTilt: 5,
    color: "#4ade80",
  },
  sad: {
    eyebrowAngle: 15,
    eyeScale: 0.9,
    mouthCurve: -0.3,
    mouthWidth: 0.5,
    blush: false,
    pupilY: 5,
    headTilt: -5,
    color: "#60a5fa",
  },
  angry: {
    eyebrowAngle: 25,
    eyeScale: 0.85,
    mouthCurve: -0.1,
    mouthWidth: 0.6,
    blush: false,
    pupilY: 0,
    headTilt: -3,
    color: "#ef4444",
  },
  surprised: {
    eyebrowAngle: -20,
    eyeScale: 1.4,
    mouthCurve: 0,
    mouthWidth: 0.4,
    mouthOpen: 0.5,
    blush: false,
    pupilY: -3,
    headTilt: 0,
    color: "#f97316",
  },
  fearful: {
    eyebrowAngle: -10,
    eyeScale: 1.3,
    mouthCurve: -0.15,
    mouthWidth: 0.55,
    blush: false,
    pupilY: 2,
    headTilt: -2,
    color: "#a78bfa",
  },
  disgusted: {
    eyebrowAngle: 10,
    eyeScale: 0.8,
    mouthCurve: -0.2,
    mouthWidth: 0.5,
    mouthSkew: true,
    blush: false,
    pupilY: 3,
    headTilt: 8,
    color: "#fb923c",
  },
  neutral: {
    eyebrowAngle: 0,
    eyeScale: 1,
    mouthCurve: 0.05,
    mouthWidth: 0.5,
    blush: false,
    pupilY: 0,
    headTilt: 0,
    color: "#94a3b8",
  },
};

export default function Avatar({ emotion = "neutral", isSpeaking = false }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [currentEmotion, setCurrentEmotion] = useState(EMOTIONS.neutral);
  const [targetEmotion, setTargetEmotion] = useState(EMOTIONS.neutral);

  // Animation state
  const stateRef = useRef({
    mouthOpenAmount: 0,
    blinkTimer: 0,
    isBlinking: false,
    breathePhase: 0,
    headBobPhase: 0,
    eyeLookX: 0,
    eyeLookY: 0,
    transitionProgress: 1,
  });

  // Update target emotion when prop changes
  useEffect(() => {
    setTargetEmotion(EMOTIONS[emotion] || EMOTIONS.neutral);
    stateRef.current.transitionProgress = 0;
  }, [emotion]);

  // Lerp helper
  const lerp = (start, end, t) => start + (end - start) * t;

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let lastTime = 0;

    const animate = (timestamp) => {
      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const state = stateRef.current;

      // Update transition
      if (state.transitionProgress < 1) {
        state.transitionProgress = Math.min(
          state.transitionProgress + deltaTime * 3,
          1,
        );

        // Lerp all emotion values
        setCurrentEmotion((prev) => ({
          eyebrowAngle: lerp(
            prev.eyebrowAngle,
            targetEmotion.eyebrowAngle,
            state.transitionProgress,
          ),
          eyeScale: lerp(
            prev.eyeScale,
            targetEmotion.eyeScale,
            state.transitionProgress,
          ),
          mouthCurve: lerp(
            prev.mouthCurve,
            targetEmotion.mouthCurve,
            state.transitionProgress,
          ),
          mouthWidth: lerp(
            prev.mouthWidth,
            targetEmotion.mouthWidth,
            state.transitionProgress,
          ),
          mouthOpen: lerp(
            prev.mouthOpen || 0,
            targetEmotion.mouthOpen || 0,
            state.transitionProgress,
          ),
          blush: targetEmotion.blush,
          pupilY: lerp(
            prev.pupilY,
            targetEmotion.pupilY,
            state.transitionProgress,
          ),
          headTilt: lerp(
            prev.headTilt,
            targetEmotion.headTilt,
            state.transitionProgress,
          ),
          color: targetEmotion.color,
          mouthSkew: targetEmotion.mouthSkew,
        }));
      }

      // Update breathing
      state.breathePhase += deltaTime * 1.5;
      const breathe = Math.sin(state.breathePhase) * 2;

      // Update head bob when speaking
      if (isSpeaking) {
        state.headBobPhase += deltaTime * 8;
      }
      const headBob = isSpeaking ? Math.sin(state.headBobPhase) * 3 : 0;

      // Update mouth for speaking
      if (isSpeaking) {
        state.mouthOpenAmount =
          0.3 +
          Math.sin(timestamp * 0.015) * 0.2 +
          Math.sin(timestamp * 0.025) * 0.15;
      } else {
        state.mouthOpenAmount = Math.max(
          0,
          state.mouthOpenAmount - deltaTime * 5,
        );
      }

      // Update blinking
      state.blinkTimer += deltaTime;
      if (state.blinkTimer > 3 + Math.random() * 2) {
        state.isBlinking = true;
        state.blinkTimer = 0;
      }
      if (state.isBlinking) {
        state.blinkTimer += deltaTime * 20;
        if (state.blinkTimer > 0.15) {
          state.isBlinking = false;
          state.blinkTimer = 0;
        }
      }

      // Random eye movement
      if (Math.random() < 0.01) {
        state.eyeLookX = (Math.random() - 0.5) * 6;
        state.eyeLookY = (Math.random() - 0.5) * 4;
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Save context for head tilt
      ctx.save();
      ctx.translate(centerX, centerY + breathe + headBob);
      ctx.rotate((currentEmotion.headTilt * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      // Draw avatar
      drawAvatar(ctx, centerX, centerY, currentEmotion, state, isSpeaking);

      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetEmotion, isSpeaking, currentEmotion]);

  const drawAvatar = (ctx, cx, cy, emotion, state, speaking) => {
    // === NECK ===
    ctx.fillStyle = "#e8c4a8";
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy + 55);
    ctx.lineTo(cx - 20, cy + 90);
    ctx.lineTo(cx + 20, cy + 90);
    ctx.lineTo(cx + 25, cy + 55);
    ctx.fill();

    // === SHIRT ===
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 90);
    ctx.quadraticCurveTo(cx - 50, cy + 120, cx - 40, cy + 130);
    ctx.lineTo(cx + 40, cy + 130);
    ctx.quadraticCurveTo(cx + 50, cy + 120, cx + 45, cy + 90);
    ctx.lineTo(cx + 20, cy + 90);
    ctx.quadraticCurveTo(cx, cy + 100, cx - 20, cy + 90);
    ctx.fill();

    // Collar
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 88);
    ctx.lineTo(cx - 10, cy + 98);
    ctx.lineTo(cx, cy + 92);
    ctx.lineTo(cx + 10, cy + 98);
    ctx.lineTo(cx + 20, cy + 88);
    ctx.fill();

    // === EARS ===
    ctx.fillStyle = "#f5d0a9";
    // Left ear
    ctx.beginPath();
    ctx.ellipse(cx - 58, cy, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#deb896";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner ear detail
    ctx.beginPath();
    ctx.ellipse(cx - 56, cy, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.strokeStyle = "#d4a574";
    ctx.stroke();

    // Right ear
    ctx.fillStyle = "#f5d0a9";
    ctx.beginPath();
    ctx.ellipse(cx + 58, cy, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#deb896";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx + 56, cy, 4, 8, -0.2, 0, Math.PI * 2);
    ctx.strokeStyle = "#d4a574";
    ctx.stroke();

    // === HEAD (3D effect with gradient) ===
    const headGradient = ctx.createRadialGradient(
      cx - 15,
      cy - 20,
      0,
      cx,
      cy,
      70,
    );
    headGradient.addColorStop(0, "#fce7d6");
    headGradient.addColorStop(0.7, "#f5d0a9");
    headGradient.addColorStop(1, "#e8c4a8");

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head outline with emotion color
    ctx.strokeStyle = emotion.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // === HAIR ===
    const hairGradient = ctx.createLinearGradient(cx, cy - 80, cx, cy - 20);
    hairGradient.addColorStop(0, "#2d1810");
    hairGradient.addColorStop(1, "#4a3728");

    ctx.fillStyle = hairGradient;
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 20);
    ctx.quadraticCurveTo(cx - 60, cy - 50, cx - 45, cy - 65);
    ctx.quadraticCurveTo(cx - 20, cy - 85, cx, cy - 80);
    ctx.quadraticCurveTo(cx + 20, cy - 85, cx + 45, cy - 65);
    ctx.quadraticCurveTo(cx + 60, cy - 50, cx + 55, cy - 20);
    ctx.quadraticCurveTo(cx + 50, cy - 45, cx + 30, cy - 55);
    ctx.quadraticCurveTo(cx, cy - 60, cx - 30, cy - 55);
    ctx.quadraticCurveTo(cx - 50, cy - 45, cx - 55, cy - 20);
    ctx.fill();

    // Hair highlight
    ctx.strokeStyle = "#5a4535";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 65);
    ctx.quadraticCurveTo(cx - 15, cy - 75, cx + 5, cy - 70);
    ctx.stroke();

    // === EYEBROWS ===
    ctx.strokeStyle = "#3d2817";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Left eyebrow
    ctx.save();
    ctx.translate(cx - 22, cy - 25);
    ctx.rotate((emotion.eyebrowAngle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(0, -5, 15, 0);
    ctx.stroke();
    ctx.restore();

    // Right eyebrow
    ctx.save();
    ctx.translate(cx + 22, cy - 25);
    ctx.rotate((-emotion.eyebrowAngle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(0, -5, 15, 0);
    ctx.stroke();
    ctx.restore();

    // === EYES ===
    const eyeY = cy - 5;
    const eyeSpacing = 25;
    const eyeScale = emotion.eyeScale;

    if (state.isBlinking) {
      // Closed eyes
      ctx.strokeStyle = "#2d1810";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - eyeSpacing - 12, eyeY);
      ctx.lineTo(cx - eyeSpacing + 12, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + eyeSpacing - 12, eyeY);
      ctx.lineTo(cx + eyeSpacing + 12, eyeY);
      ctx.stroke();
    } else {
      // Left eye
      drawEye(
        ctx,
        cx - eyeSpacing,
        eyeY,
        eyeScale,
        state.eyeLookX,
        state.eyeLookY + emotion.pupilY,
      );

      // Right eye
      drawEye(
        ctx,
        cx + eyeSpacing,
        eyeY,
        eyeScale,
        state.eyeLookX,
        state.eyeLookY + emotion.pupilY,
      );
    }

    // === NOSE ===
    ctx.strokeStyle = "#deb896";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 5);
    ctx.lineTo(cx - 5, cy + 20);
    ctx.quadraticCurveTo(cx, cy + 25, cx + 5, cy + 20);
    ctx.stroke();

    // Nostril hints
    ctx.fillStyle = "#d4a574";
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy + 22, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy + 22, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // === BLUSH ===
    if (emotion.blush) {
      ctx.fillStyle = "rgba(255, 150, 150, 0.3)";
      ctx.beginPath();
      ctx.ellipse(cx - 38, cy + 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 38, cy + 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === MOUTH ===
    const mouthY = cy + 40;
    const mouthWidth = 35 * emotion.mouthWidth;
    const mouthOpen = speaking ? state.mouthOpenAmount : emotion.mouthOpen || 0;

    if (mouthOpen > 0.1) {
      // Open mouth
      ctx.fillStyle = "#8b4557";
      ctx.beginPath();
      ctx.moveTo(cx - mouthWidth, mouthY);
      ctx.quadraticCurveTo(
        cx,
        mouthY + mouthOpen * 40,
        cx + mouthWidth,
        mouthY,
      );
      ctx.quadraticCurveTo(
        cx,
        mouthY - mouthOpen * 10,
        cx - mouthWidth,
        mouthY,
      );
      ctx.fill();

      // Teeth
      if (mouthOpen > 0.2) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.rect(cx - mouthWidth * 0.6, mouthY - 2, mouthWidth * 1.2, 8);
        ctx.fill();
      }

      // Tongue hint
      if (mouthOpen > 0.3) {
        ctx.fillStyle = "#c45b6a";
        ctx.beginPath();
        ctx.ellipse(cx, mouthY + mouthOpen * 25, 12, 8, 0, 0, Math.PI);
        ctx.fill();
      }
    } else {
      // Closed mouth with expression
      ctx.strokeStyle = "#8b4557";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(cx - mouthWidth, mouthY);

      if (emotion.mouthSkew) {
        // Disgusted skewed mouth
        ctx.quadraticCurveTo(
          cx - 10,
          mouthY + emotion.mouthCurve * 25,
          cx,
          mouthY - 3,
        );
        ctx.quadraticCurveTo(
          cx + 15,
          mouthY + emotion.mouthCurve * 15,
          cx + mouthWidth,
          mouthY + 5,
        );
      } else {
        ctx.quadraticCurveTo(
          cx,
          mouthY + emotion.mouthCurve * 30,
          cx + mouthWidth,
          mouthY,
        );
      }
      ctx.stroke();
    }

    // === SPEAKING INDICATOR ===
    if (speaking) {
      const waveIntensity = state.mouthOpenAmount;

      // Sound waves - left
      ctx.strokeStyle = emotion.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5 + waveIntensity * 0.3;

      for (let i = 0; i < 3; i++) {
        const offset = i * 8 + Math.sin(Date.now() * 0.01 + i) * 3;
        ctx.beginPath();
        ctx.arc(cx - 75 - offset, cy, 5 + i * 3, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }

      // Sound waves - right
      for (let i = 0; i < 3; i++) {
        const offset = i * 8 + Math.sin(Date.now() * 0.01 + i) * 3;
        ctx.beginPath();
        ctx.arc(cx + 75 + offset, cy, 5 + i * 3, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  };

  const drawEye = (ctx, x, y, scale, lookX, lookY) => {
    const eyeWidth = 14 * scale;
    const eyeHeight = 10 * scale;

    // Eye white
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x, y, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye outline
    ctx.strokeStyle = "#2d1810";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Iris
    const irisSize = 7 * scale;
    ctx.fillStyle = "#4a7c59";
    ctx.beginPath();
    ctx.ellipse(x + lookX, y + lookY, irisSize, irisSize, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.ellipse(
      x + lookX,
      y + lookY,
      irisSize * 0.5,
      irisSize * 0.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Eye highlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(
      x + lookX - 2,
      y + lookY - 2,
      2 * scale,
      2 * scale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Eyelid shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.beginPath();
    ctx.ellipse(
      x,
      y - eyeHeight * 0.3,
      eyeWidth,
      eyeHeight * 0.4,
      0,
      0,
      Math.PI,
    );
    ctx.fill();
  };

  return (
    <div className="avatar-container" data-emotion={emotion}>
      <canvas
        ref={canvasRef}
        width={220}
        height={260}
        className="avatar-canvas"
      />
      <div className="avatar-info">
        <span
          className="avatar-emotion-label"
          style={{ color: targetEmotion.color }}
        >
          {emotion}
        </span>
        {isSpeaking && (
          <span className="avatar-speaking-label">Speaking...</span>
        )}
      </div>
    </div>
  );
}
