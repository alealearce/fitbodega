import Link from "next/link";

// Lime hero lines shared by the Top 100 hub and every list page:
// claim your profile, or get the Measure Up report if you're not ranked.
export default function HeroClaimLines() {
  return (
    <div className="mt-6 max-w-2xl space-y-2">
      <p className="font-sans text-sm lg:text-base text-primary">
        Claim your profile to make any updates — including your picture.
      </p>
      <p className="font-sans text-sm lg:text-base text-primary">
        Not on the list… yet? Add your IG and URL{" "}
        <Link href="/measure-up" className="font-bold underline underline-offset-4">
          here
        </Link>{" "}
        to receive a report that compares your business with the Top 100.
      </p>
    </div>
  );
}
