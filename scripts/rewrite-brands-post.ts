// One-off: regenerate how-to-work-with-fitness-creators under the new
// advice-first prompt and update the live row in place (same slug, same id).
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { BACKLOG } from '../lib/content/backlog';
import { writePost, coverImageUrl } from '../lib/content/generate';

async function main() {
  const topic = BACKLOG.find((t) => t.slug === 'how-to-work-with-fitness-creators')!;
  console.log('writing under new prompt:', topic.slug);
  const draft = await writePost(topic);
  console.log('got:', draft.title, '—', draft.content.split(/\s+/).length, 'words');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase
    .from('blog_posts')
    .update({
      title: draft.title,
      content: draft.content,
      excerpt: draft.excerpt,
      meta_title: draft.meta_title,
      meta_description: draft.meta_description,
      tags: draft.tags ?? [],
      reading_time_minutes: draft.reading_time_minutes,
      cover_image: coverImageUrl(draft.slug, draft.title, topic.track),
      updated_at: new Date().toISOString(),
    })
    .eq('slug', topic.slug);
  if (error) throw error;
  console.log('row updated');
  console.log('\n--- opening ---\n');
  console.log(draft.content.slice(0, 1200));
}
main().catch((e) => { console.error(e); process.exit(1); });
