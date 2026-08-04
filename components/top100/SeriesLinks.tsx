import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Every list in the FitBodega 100 series. Add new lists here and every list
// page's "More of the series" section picks them up.
export const TOP100_LISTS = [
  { slug: "/top-100-fitness-influencers", title: "Top 100 Fitness Influencers" },
  { slug: "/top-100-gyms", title: "Top 100 Gyms in the World" },
  { slug: "/top-100-fitness-retreats", title: "Top 100 Fitness Retreats & Wellness Resorts" },
  { slug: "/top-100-hyrox-athletes", title: "Top 100 Hyrox Athletes to Follow" },
  { slug: "/top-100-online-fitness-coaches", title: "Top 100 Online Fitness Coaches" },
  { slug: "/top-100-recovery-spaces", title: "Top 100 Recovery Spaces" },
] as const;

export default function SeriesLinks({ current }: { current: string }) {
  const others = TOP100_LISTS.filter((l) => l.slug !== current);
  if (others.length === 0) return null;
  return (
    <section className="py-20 lg:py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-[3px] bg-primary" aria-hidden />
          <p className="font-sans text-label-md uppercase text-primary">More of the series</p>
        </div>
        <div>
          {others.map((l) => (
            <Link
              key={l.slug}
              href={l.slug}
              className="group flex items-baseline justify-between gap-6 py-7 hover:bg-surface-low -mx-6 lg:-mx-8 px-6 lg:px-8 transition-colors duration-300"
            >
              <h3 className="font-serif text-2xl lg:text-4xl font-extrabold uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors duration-300">
                {l.title}
              </h3>
              <ArrowUpRight
                size={22}
                className="flex-shrink-0 text-outline-variant group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
