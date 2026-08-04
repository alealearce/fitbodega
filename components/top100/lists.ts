// The FitBodega 100 — single registry for every list in the series.
// Nav dropdown, homepage tiles, and each list page's "More of the series"
// section all read from this array: adding a list here wires it everywhere.
export const TOP100_LISTS = [
  {
    slug: "/top-100-fitness-influencers",
    title: "Top 100 Fitness Influencers",
    navLabel: "Fitness Influencers",
    desc: "The people who move training culture",
  },
  {
    slug: "/top-100-gyms",
    title: "Top 100 Gyms in the World",
    navLabel: "Gyms in the World",
    desc: "Iron meccas & champion factories",
  },
  {
    slug: "/top-100-fitness-retreats",
    title: "Top 100 Fitness Retreats & Wellness Resorts",
    navLabel: "Fitness Retreats",
    desc: "Where to book a stay and train",
  },
  {
    slug: "/top-100-hyrox-athletes",
    title: "Top 100 Hyrox Athletes to Follow",
    navLabel: "Hyrox Athletes",
    desc: "The racers and voices of fitness racing",
  },
  {
    slug: "/top-100-online-fitness-coaches",
    title: "Top 100 Online Fitness Coaches",
    navLabel: "Online Coaches",
    desc: "Coaches you can actually hire",
  },
  {
    slug: "/top-100-recovery-spaces",
    title: "Top 100 Recovery Spaces",
    navLabel: "Recovery Spaces",
    desc: "Bathhouses, saunas & thermal lagoons",
  },
  {
    slug: "/top-100-run-clubs",
    title: "Top 100 Run Clubs & Fitness Crews",
    navLabel: "Run Clubs & Crews",
    desc: "The communities people show up for",
  },
  {
    slug: "/top-100-health-food-stores",
    title: "Top 100 Health Food Stores",
    navLabel: "Health Food Stores",
    desc: "Grocers, co-ops & farm shops",
  },
  {
    slug: "/top-100-nutritionists",
    title: "Top 100 Nutritionists",
    navLabel: "Nutritionists",
    desc: "Credentialed dietitians & researchers",
  },
] as const;
