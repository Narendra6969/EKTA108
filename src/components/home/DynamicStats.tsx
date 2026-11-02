"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Clock, Users } from "lucide-react";

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endValue = end;
    if (start === endValue) return;

    const incrementTime = (duration / endValue);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === endValue) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span className="font-bold">{count.toLocaleString()}{suffix}</span>;
};

const StatCard = ({ icon, value, label, suffix }: { icon: React.ReactNode, value: number, label: string, suffix?: string }) => (
    <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow border">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
            {icon}
        </div>
        <p className="text-4xl text-primary">
            <AnimatedCounter end={value} suffix={suffix} />
        </p>
        <p className="text-muted-foreground mt-1">{label}</p>
    </div>
);


export default function DynamicStats() {
    return (
        <section className="w-full py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">Our Platform's Impact</h2>
                    <p className="mt-2 text-muted-foreground">Real-time data showcasing our commitment to saving lives.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                   <StatCard icon={<TrendingUp className="h-8 w-8 text-primary" />} value={1258} label="Incidents Reported This Month" />
                   <StatCard icon={<Clock className="h-8 w-8 text-primary" />} value={7} label="Average Response Time (Mins)" suffix=" min" />
                   <StatCard icon={<Users className="h-8 w-8 text-primary" />} value={4321} label="Community Lives Impacted" />
                </div>
            </div>
        </section>
    );
}
