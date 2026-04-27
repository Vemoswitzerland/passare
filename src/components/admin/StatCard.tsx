import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Trend = 'up' | 'down' | 'neutral';

type StatCardProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string | number;
  label: string;
  trend?: { direction: Trend; text: string };
  progress?: number; // 0–100
  className?: string;
};

const trendStyles: Record<Trend, string> = {
  up: 'text-success bg-success/10',
  down: 'text-danger bg-danger/10',
  neutral: 'text-quiet bg-stone/40',
};

const TrendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function StatCard({ icon: Icon, value, label, trend, progress, className }: StatCardProps) {
  const Trend = trend ? TrendIcon[trend.direction] : null;

  return (
    <div
      className={cn(
        'bg-paper border border-stone rounded-card p-5 flex flex-col gap-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-soft bg-stone/50 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-navy" strokeWidth={1.5} />
        </div>
        {trend && Trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-caption font-medium',
              trendStyles[trend.direction],
            )}
          >
            <Trend className="w-3 h-3" strokeWidth={2} />
            {trend.text}
          </span>
        )}
      </div>

      <div>
        <p className="font-serif text-3xl text-navy font-light leading-none mb-1">{value}</p>
        <p className="text-caption text-quiet uppercase tracking-wider">{label}</p>
      </div>

      {typeof progress === 'number' && (
        <div className="h-1 bg-stone rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-bronze transition-all duration-700 ease-out-expo"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
