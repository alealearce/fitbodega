/**
 * lib/demo/listings.ts — FitBodega demo seed
 * REAL Vancouver businesses, researched and verified against their own
 * websites (2026-07-10). Used by the mock Supabase client for the local
 * preview and as the go-live seed base.
 *
 * Notes:
 * - rating_avg stays 0 (we have no verified review data; the UI hides it).
 * - Photo covers in public/listings/ are each business's own marketing
 *   imagery (og:image / homepage heroes), normalized to 1600px jpg.
 *   At go-live, request or license proper imagery per listing.
 */
import type { Listing } from "@/lib/supabase/types";

const NOW = "2026-07-10T12:00:00.000Z";

function listing(partial: Partial<Listing> & Pick<Listing, "id" | "name" | "slug" | "type">): Listing {
  return {
    created_at: NOW,
    updated_at: NOW,
    description: null,
    long_description: null,
    tagline: null,
    logo_url: null,
    images: [],
    website: null,
    email: null,
    phone: null,
    address: null,
    city: "Vancouver",
    country: "Canada",
    latitude: 49.2827,
    longitude: -123.1207,
    specialties: [],
    experience_levels: ["All Levels"],
    languages: ["English"],
    price_range: null,
    social_instagram: null,
    social_facebook: null,
    social_youtube: null,
    status: "approved",
    is_featured: false,
    is_verified: false,
    owner_id: null,
    view_count: 0,
    rating_avg: 0,
    rating_count: 0,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    plan: "free",
    plan_expires_at: null,
    certification_id: null,
    last_featured_at: null,
    ...partial,
  };
}

export const DEMO_LISTINGS: Listing[] = [
  // ── Recovery ────────────────────────────────────────────────────────────
  listing({
    id: "real-01", name: "Circle Wellness", slug: "circle-wellness", type: "recovery",
    tagline: "Your own private thermal circuit, no strangers included.",
    description: "Circle Wellness on Granville Island runs a self-guided, automated six-step thermal spa circuit — open-air shower, cedar soak, Himalayan salt sauna, cold plunge, and heated riverstone bed — booked in private 90- or 120-minute pods for up to two people.",
    specialties: ["Private Thermal Circuit", "Cedar Soaking Tub", "Himalayan Salt Sauna", "Cold Plunge"],
    images: ["/listings/circle-wellness.webp"], price_range: "$$$$",
    website: "https://circlewellnessspas.com/", phone: "604-881-1759",
    social_instagram: "https://www.instagram.com/circlewellnessspas/",
    address: "1297 Johnston St, Granville Island", is_featured: true,
  }),
  listing({
    id: "real-02", name: "AetherHaus", slug: "aetherhaus", type: "recovery",
    tagline: "Sauna and cold plunge, Eastern European style — phones stay in the locker.",
    description: "AetherHaus is a Slavic- and Nordic-inspired sauna and cold plunge studio on Davie Street in the West End, offering Himalayan salt sauna sessions, communal cold plunge pools, Aufguss rituals, and a tea lounge. Sessions run silent, casual, or social, and devices are checked at the door.",
    specialties: ["Himalayan Salt Sauna", "Communal Cold Plunge", "Aufguss", "Tea Lounge"],
    images: ["/listings/aetherhaus.jpg"],
    website: "https://www.aetherhaus.ca/", phone: "604-336-0776",
    social_instagram: "https://www.instagram.com/aetherhaus/",
    address: "1768 Davie St, West End", is_featured: true,
  }),
  listing({
    id: "real-03", name: "Regen Recovery", slug: "regen-recovery", type: "recovery",
    tagline: "Sauna, plunge, and a DEXA scan before you leave.",
    description: "Regen Recovery in Cedar Cottage offers private-room sauna and cold plunge bookings alongside red light therapy, hyperbaric oxygen, DEXA body composition scans, VO2 max testing, and IV drips, with physiotherapy and RMT on site.",
    specialties: ["Infrared Sauna", "Cold Plunge", "Red Light Therapy", "DEXA / VO2 Max", "IV Therapy"],
    images: ["/listings/regen-recovery.jpg"], price_range: "$$$",
    website: "https://regen-recovery.ca/", phone: "604-336-8141",
    social_instagram: "https://www.instagram.com/regenrecovery",
    address: "1433 Cedar Cottage Mews",
  }),

  // ── Gyms & Studios ──────────────────────────────────────────────────────
  listing({
    id: "real-04", name: "House Concepts", slug: "house-concepts", type: "gym",
    tagline: "Four disciplines, one roof — run, box, strengthen, stretch.",
    description: "House Concepts is the flagship fitness studio at Vancouver House, housing four training concepts — Basecamp Athletics, Butterfly Boxing, Guest House, and Bond Run Club — under one 15,000-square-foot roof. Private training includes an InBody 270 assessment and a custom-built program.",
    specialties: ["Running", "Boxing", "Strength Training", "Mobility", "Private Training"],
    images: ["/listings/house-concepts.jpg"],
    website: "https://houseconcepts.com/", phone: "604-566-8980",
    social_instagram: "https://www.instagram.com/houseconcepts/",
    address: "701-1431 Continental St, Beach District", is_featured: true,
  }),
  listing({
    id: "real-05", name: "Equinox Vancouver", slug: "equinox-vancouver", type: "gym",
    tagline: "Six studios, one downtown address, zero shortcuts.",
    description: "Equinox's West Georgia Street club was the brand's first Canadian location, a 33,000-square-foot facility with dedicated yoga, barre, boxing, and cycling studios plus a full-service spa. Membership includes unlimited access to group classes across every format.",
    specialties: ["Personal Training", "Group Fitness", "Boxing", "Cycling", "Spa"],
    images: ["/listings/equinox-vancouver.jpg"], price_range: "$$$$",
    website: "https://www.equinox.com/clubs/canada/vancouver/westgeorgiast", phone: "604-449-3002",
    social_instagram: "https://www.instagram.com/equinox/",
    address: "1131 West Georgia St, Downtown", is_featured: true,
  }),

  // ── Coaches & Trainers ──────────────────────────────────────────────────
  listing({
    id: "real-06", name: "The Program Fitness", slug: "the-program-fitness", type: "trainer",
    tagline: "A real gym built for independent trainers to run their own book.",
    description: "The Program Fitness on Gore Avenue is a training facility where certified personal trainers and kinesiologists operate independent practices, offering strength, hybrid, running, and youth development classes alongside ICBC active rehabilitation.",
    specialties: ["Personal Training", "Kinesiology", "Active Rehab", "Strength Classes"],
    images: ["/listings/the-program-fitness.jpg"],
    website: "https://theprogramfitness.com/",
    social_instagram: "https://www.instagram.com/theprogramfitness/",
    address: "747 Gore Ave, Strathcona",
  }),
  listing({
    id: "real-07", name: "Le Physique", slug: "le-physique", type: "trainer",
    tagline: "One-on-one training in False Creek, no crowd, no guesswork.",
    description: "Le Physique is a private personal training studio at Leg-In-Boot Square in False Creek offering exclusive 1:1 sessions built around Smart Programming, plus kinesiology, ICBC active rehab, and nutrition coaching.",
    specialties: ["1:1 Personal Training", "Kinesiology", "Active Rehab", "Nutrition Coaching"],
    images: ["/listings/le-physique.jpg"],
    website: "https://www.lephysique.com/", phone: "604-873-2255",
    address: "662 Leg-In-Boot Square, False Creek",
  }),

  // ── Clubs ───────────────────────────────────────────────────────────────
  listing({
    id: "real-08", name: "Flight Crew Run Club", slug: "flight-crew-run-club", type: "club",
    tagline: "No-drop group runs out of Kitsilano, every pace welcome.",
    description: "Flight Crew Run Club, based out of Vancouver Running Company on West 4th Avenue, hosts free Thursday evening road runs at 3K, 5K, and 10K distances plus monthly trail outings, led by volunteer run leaders.",
    specialties: ["Run Club", "Free Group Runs", "Trail Runs", "No-Drop Policy"],
    images: ["/listings/flight-crew-run-club.jpg"],
    website: "https://vanrunco.com/pages/flight-crew", phone: "778-379-8511",
    social_instagram: "https://www.instagram.com/flightcrewrunclub/",
    address: "2033 W 4th Ave, Kitsilano", is_featured: true,
  }),
  listing({
    id: "real-09", name: "Lotus Cycling Club", slug: "lotus-cycling-club", type: "club",
    tagline: "Group rides out of UBC for riders who actually train.",
    description: "Lotus Cycling Club is a Vancouver road cycling club running weekly training rides departing from University Hill, alongside bike mechanics workshops, coaching partnerships, and cause-oriented fundraiser rides.",
    specialties: ["Cycling Club", "Group Road Rides", "Race Training", "Mechanics Workshops"],
    images: ["/listings/lotus-cycling-club.jpg"],
    website: "https://www.lotuscyclingclub.com/", phone: "604-619-8101",
    social_instagram: "https://www.instagram.com/lotus.cycling.club/",
    address: "University Hill, UBC",
  }),

  // ── Nutritionists ───────────────────────────────────────────────────────
  listing({
    id: "real-10", name: "Vanguard Performance", slug: "vanguard-performance", type: "nutritionist",
    tagline: "Downtown sports nutrition, built around your training block.",
    description: "Vanguard Performance's registered dietitian, based at their West Hastings Street clinic downtown, builds nutrition plans for athletes and active clients covering performance fueling, weight management, and supplement review.",
    specialties: ["Sports Nutrition", "Registered Dietitian", "Supplement Review"],
    images: ["/listings/vanguard-performance.jpg"],
    website: "https://www.vanguardperformance.ca/clinic/dietitian/", phone: "236-427-4283",
    social_instagram: "https://www.instagram.com/vanguard_vancouver/",
    address: "420 W Hastings St #270, Downtown",
  }),
  listing({
    id: "real-11", name: "No Sweat Nutrition", slug: "no-sweat-nutrition", type: "nutritionist",
    tagline: "Fueling endurance athletes who train past what's sustainable.",
    description: "No Sweat Nutrition is a Vancouver-based virtual sports nutrition practice led by a clinical dietitian and competitive distance runner, specializing in RED-S, fueling for endurance training and racing, and GI and iron-deficiency issues in athletes.",
    specialties: ["Endurance Fueling", "RED-S", "Registered Dietitian", "Iron & Micronutrients"],
    images: ["/listings/no-sweat-nutrition.jpg"], price_range: "$$$",
    website: "https://nosweatnutrition.ca/",
    social_instagram: "https://www.instagram.com/nosweatnutrition/",
  }),

  // ── Health Food Stores ──────────────────────────────────────────────────
  listing({
    id: "real-12", name: "Body Energy Club", slug: "body-energy-club", type: "store",
    tagline: "Vancouver's original supplement-and-smoothie corner store.",
    description: "Body Energy Club opened on Davie Street in 2002 and has grown into a multi-location Metro Vancouver chain stocking 300+ supplement brands alongside a full smoothie, protein shake, and acai bowl bar.",
    specialties: ["Supplements", "Smoothie Bar", "Protein & Creatine"],
    images: ["/listings/body-energy-club.jpg"], price_range: "$$",
    website: "https://www.bodyenergyclub.com/", phone: "778-653-4105",
    social_instagram: "https://www.instagram.com/bodyenergyclub/",
    address: "746 Davie St, Davie Village",
  }),
  listing({
    id: "real-13", name: "Greens Organic & Natural Market", slug: "greens-organic-natural-market", type: "store",
    tagline: "Kitsilano's organic grocery since before it was a trend.",
    description: "Greens Organic & Natural Market has run an independently owned organic grocery on West Broadway in Kitsilano since 2010, covering produce, meat, poultry, and seafood alongside natural packaged goods.",
    specialties: ["Organic Produce", "Natural Grocery", "Health Foods"],
    images: ["/listings/greens-market.webp"], price_range: "$$$",
    website: "https://greensmarket.ca/", phone: "604-568-3079",
    social_instagram: "https://www.instagram.com/greensmarket/",
    address: "1978 W Broadway, Kitsilano",
  }),

  // ── Youth Sports ────────────────────────────────────────────────────────
  listing({
    id: "real-14", name: "Vancouver United FC", slug: "vancouver-united-fc", type: "youth",
    tagline: "2,800 kids, one westside club, Canada Soccer's top license.",
    description: "Vancouver United FC is a westside youth soccer club formed from three legacy associations — Dunbar, Kerrisdale, and Point Grey — running programs from First Kicks (U4) through U18 divisional and BCSPL play, and holds Canada Soccer's National Youth Club License.",
    specialties: ["Youth Soccer U4-U18", "BCSPL", "Academy Program"],
    images: ["/listings/vancouver-united-fc.jpg"],
    website: "https://vancouverunitedfc.com/", phone: "604-674-4109",
    social_instagram: "https://www.instagram.com/vanufc/",
    address: "Westside", is_featured: true,
  }),
  listing({
    id: "real-15", name: "KLM Soccer Club", slug: "klm-soccer-club", type: "youth",
    tagline: "Community soccer on Fraser Street, ninety-nine bucks and a jersey.",
    description: "KLM Soccer Club is a volunteer-run, non-profit youth soccer club based on Fraser Street, offering U4-U18 programs, after-school leagues, and camps at a flat $99 program fee with financial assistance available.",
    specialties: ["Youth Soccer U4-U18", "Non-Profit", "After-School Leagues", "Camps"],
    images: ["/listings/klm-soccer-club.jpg"], price_range: "$",
    website: "https://klmsoccer.ca/",
    social_instagram: "https://www.instagram.com/klmsoccerclub/",
    address: "185-6647 Fraser St, Sunset",
  }),
];
