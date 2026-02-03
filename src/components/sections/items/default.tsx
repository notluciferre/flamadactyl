import {
  BlocksIcon,
  EclipseIcon,
  FastForwardIcon,
  LanguagesIcon,
  MonitorSmartphoneIcon,
  RocketIcon,
  ScanFaceIcon,
  SquarePenIcon,
} from "lucide-react";
import { ReactNode } from "react";

import { Item, ItemDescription,ItemIcon, ItemTitle } from "../../ui/item";
import { Section } from "../../ui/section";

interface ItemProps {
  title: string;
  description: string;
  icon: ReactNode;
}

interface ItemsProps {
  title?: string;
  items?: ItemProps[] | false;
  className?: string;
}

export default function Items({
  title = "Everything you need. Nothing you don't.",
  items = [
    {
      title: "Instant Deploy",
      description: "Deploy your bots in seconds with one-click setup",
      icon: <RocketIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "99.9% Uptime",
      description: "Reliable hosting with automatic failover protection",
      icon: <MonitorSmartphoneIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "Real-time Monitoring",
      description: "Track performance, logs, and status in real-time",
      icon: <FastForwardIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "Easy to Scale",
      description: "Upgrade resources instantly as your bot grows",
      icon: <BlocksIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "Auto Restart",
      description: "Automatic bot restart on crash or failure detection",
      icon: <EclipseIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "Resource Control",
      description: "Set CPU and RAM limits for optimal performance",
      icon: <LanguagesIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "Secure Access",
      description: "Protected environment with encrypted connections",
      icon: <ScanFaceIcon className="size-5 stroke-1 text-primary" />,
    },
    {
      title: "File Manager",
      description: "Easy file management directly from your dashboard",
      icon: <SquarePenIcon className="size-5 stroke-1 text-primary" />,
    },
  ],
  className,
}: ItemsProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-20">
        <h2 className="max-w-[560px] text-center text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          {title}
        </h2>
        {items !== false && items.length > 0 && (
          <div className="grid auto-rows-fr grid-cols-2 gap-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {items.map((item, index) => (
              <Item key={index}>
                <ItemTitle className="flex items-center gap-2">
                  <ItemIcon>{item.icon}</ItemIcon>
                  {item.title}
                </ItemTitle>
                <ItemDescription>{item.description}</ItemDescription>
              </Item>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
