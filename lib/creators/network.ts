import { createAdminClient } from '@/lib/supabase/server';

// The creator browse only opens once there are enough real profiles to be
// worth a brand's click. Below the threshold the page holds (and stays out of
// the index) and every link into it is hidden, so nobody lands on an empty
// grid. Nothing to switch on by hand — it flips when the profiles land.
export const NETWORK_MIN_PROFILES = 3;

export async function countLiveProfiles(): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from('creator_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'live');
  return count ?? 0;
}

export async function isNetworkOpen(): Promise<boolean> {
  return (await countLiveProfiles()) >= NETWORK_MIN_PROFILES;
}
