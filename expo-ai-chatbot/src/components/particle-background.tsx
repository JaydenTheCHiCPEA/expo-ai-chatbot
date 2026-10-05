import {
  View,
  type ViewStyle,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useEffect, useMemo, useRef, useCallback } from "react";

const BLUE_PALETTE = ["#0ea5e9", "#0369a1", "#38bdf8", "#0284c7", "#06b6d4"];

type ParticleConfig = {
  cx: number;
  cy: number;
  size: number;
  opacity: number;
  color: string;
};

const makeParticles = (count: number): ParticleConfig[] => {
  return Array.from({ length: count }, (_, i) => {
    const paletteIndex = i % BLUE_PALETTE.length;
    return {
      cx: 2 + Math.random() * 96,
      cy: 4 + Math.random() * 92,
      size: 2 + Math.random() * 4,
      opacity: 0.2 + Math.random() * 0.4,
      color: BLUE_PALETTE[paletteIndex],
    };
  });
};

const Particle = ({
  cfg,
  pointer,
  dims,
}: {
  cfg: ParticleConfig;
  pointer: Animated.SharedValue<{ x: number; y: number }>;
  dims: Animated.SharedValue<{ w: number; h: number }>;
}) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const intervalRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    "worklet";
    let vx = (Math.random() - 0.5) * 2;
    let vy = (Math.random() - 0.5) * 2;
    
    const step = () => {
      if (!intervalRef.current) return;
      
      const d = dims.value;
      const maxX = Math.max(0, d.w - cfg.size - 2);
      const maxY = Math.max(0, d.h - cfg.size - 2);
      
      vx += (Math.random() - 0.5) * 1.6;
      vy += (Math.random() - 0.5) * 1.6;
      
      const speed = Math.hypot(vx, vy);
      const maxSpeed = 5;
      if (speed > maxSpeed) {
        vx = (vx / speed) * maxSpeed;
        vy = (vy / speed) * maxSpeed;
      }
      
      let nx = x.value + vx;
      let ny = y.value + vy;
      
      if (nx <= 0) {
        nx = 0;
        vx = Math.abs(vx);
      } else if (nx >= maxX) {
        nx = maxX;
        vx = -Math.abs(vx);
      }
      
      if (ny <= 0) {
        ny = 0;
        vy = Math.abs(vy);
      } else if (ny >= maxY) {
        ny = maxY;
        vy = -Math.abs(vy);
      }
      
      x.value = withTiming(nx, {
        duration: 700 + Math.random() * 600,
        easing: Easing.inOut(Easing.quad),
      });
      
      y.value = withTiming(ny, {
        duration: 700 + Math.random() * 600,
        easing: Easing.inOut(Easing.quad),
      });
    };
    
    step();
    const timerId = setInterval(step, 1300 + Math.random() * 400);
    intervalRef.current = timerId as unknown as number;
  }, [cfg.size, dims]);

  useEffect(() => {
    animate();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [animate]);

  const style = useAnimatedStyle<ViewStyle>(() => {
    const d = dims.value;
    const px = (cfg.cx * d.w) / 100 + x.value;
    const py = (cfg.cy * d.h) / 100 + y.value;
    const p = pointer.value;

    let ox = 0;
    let oy = 0;
    const dx = px - p.x;
    const dy = py - p.y;
    const dist = Math.hypot(dx, dy);
    const repulse = 120;
    if (dist < repulse && dist > 0.01) {
      const force = ((repulse - dist) / repulse) * 30;
      ox = (dx / dist) * force;
      oy = (dy / dist) * force;
    }
    return {
      transform: [
        { translateX: px + ox },
        { translateY: py + oy },
      ] as unknown as ViewStyle["transform"],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: cfg.size,
          height: cfg.size,
          borderRadius: 999,
          backgroundColor: cfg.color,
          opacity: cfg.opacity,
          shadowColor: cfg.color,
          shadowOpacity: cfg.opacity,
          shadowRadius: cfg.size * 2,
          shadowOffset: { width: 0, height: 0 },
          elevation: 3,
        },
        style,
      ]}
    />
  );
};

type ParticleBackgroundProps = {
  count?: number;
  className?: string;
};

export const ParticleBackground = ({
  count = 40,
  className,
}: ParticleBackgroundProps) => {
  const containerRef = useRef<View>(null);
  const pointer = useSharedValue({ x: -9999, y: -9999 });
  const dims = useSharedValue({ w: 400, h: 360 });
  const origin = useSharedValue({ x: 0, y: 0 });
  const particles = useMemo(() => makeParticles(count), [count]);

  const onLayout = (e: LayoutChangeEvent) => {
    dims.value = {
      w: e.nativeEvent.layout.width,
      h: e.nativeEvent.layout.height,
    };
    containerRef.current?.measureInWindow((x, y) => {
      origin.value = { x, y };
    });
  };

  const trackPointer = (e: any) => {
    const px = e.nativeEvent?.pageX ?? e.nativeEvent?.clientX;
    const py = e.nativeEvent?.pageY ?? e.nativeEvent?.clientY;
    if (px == null || py == null) return;
    pointer.value = { x: px - origin.value.x, y: py - origin.value.y };
  };

  return (
    <View
      ref={containerRef}
      className={className ?? "absolute inset-0 overflow-hidden"}
      onLayout={onLayout}
      onPointerMove={trackPointer}
      onPointerLeave={() => {
        pointer.value = { x: -9999, y: -9999 };
      }}
      onTouchMove={trackPointer}
      onTouchEnd={() => {
        pointer.value = { x: -9999, y: -9999 };
      }}
    >
      {particles.map((cfg, i) => (
        <Particle key={i} cfg={cfg} pointer={pointer} dims={dims} />
      ))}
    </View>
  );
};