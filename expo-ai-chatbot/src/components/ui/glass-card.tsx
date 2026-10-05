import { View, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends ViewProps {
  intensity?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Glass morphism card component
 * Uses expo-blur for the glass effect with a translucent background
 */
export const GlassCard = React.forwardRef<View, GlassCardProps>(
  ({ intensity = 90, className, children, ...props }, ref) => {
    return (
      <BlurView intensity={intensity} className="overflow-hidden rounded-2xl">
        <View
          ref={ref}
          className={cn(
            "border border-white/20 bg-white/10 px-4 py-3 dark:border-white/10 dark:bg-slate-900/30",
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </BlurView>
    );
  },
);

GlassCard.displayName = "GlassCard";
