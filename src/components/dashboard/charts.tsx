/**
 * Optimized Chart Components with React.memo
 * Charts only re-render when data actually changes
 */

'use client';

import { memo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const cpuData = [
  { time: '00:00', value: 186 },
  { time: '00:10', value: 305 },
  { time: '00:20', value: 237 },
  { time: '00:30', value: 400 },
  { time: '00:40', value: 500 },
  { time: '00:50', value: 350 },
  { time: '01:00', value: 280 },
];

const chartConfig = {
  value: {
    label: 'CPU Usage',
    color: 'hsl(0, 84%, 60%)',
  },
} satisfies ChartConfig;

// Memoized CPUChart - only re-renders when data changes
export const CPUChart = memo(function CPUChart() {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <AreaChart
        data={cpuData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          hide
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.2}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
});

const ramData = [
  { time: '00:00', value: 800 },
  { time: '00:10', value: 950 },
  { time: '00:20', value: 1100 },
  { time: '00:30', value: 1180 },
  { time: '00:40', value: 1180 },
  { time: '00:50', value: 1180 },
  { time: '01:00', value: 1180 },
];

const ramConfig = {
  value: {
    label: 'RAM Usage',
    color: 'hsl(0, 84%, 60%)',
  },
} satisfies ChartConfig;

// Memoized RAMChart
export const RAMChart = memo(function RAMChart() {
  return (
    <ChartContainer config={ramConfig} className="h-full w-full">
      <AreaChart
        data={ramData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          hide
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.2}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
});

const networkData = [
  { time: '00:00', upload: 50, download: 100 },
  { time: '00:10', upload: 80, download: 150 },
  { time: '00:20', upload: 120, download: 300 },
  { time: '00:30', upload: 200, download: 700 },
  { time: '00:40', upload: 150, download: 500 },
  { time: '00:50', upload: 100, download: 300 },
  { time: '01:00', upload: 80, download: 200 },
];

const networkConfig = {
  upload: {
    label: 'Upload',
    color: 'hsl(0, 84%, 60%)',
  },
  download: {
    label: 'Download',
    color: 'hsl(0, 84%, 70%)',
  },
} satisfies ChartConfig;

// Memoized NetworkChart
export const NetworkChart = memo(function NetworkChart() {
  return (
    <ChartContainer config={networkConfig} className="h-full w-full">
      <AreaChart
        data={networkData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          hide
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="download"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.2}
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="upload"
          stroke="#f87171"
          fill="#f87171"
          fillOpacity={0.2}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
});
