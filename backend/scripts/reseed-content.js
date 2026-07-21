/**
 * ONE-TIME re-seed of dynamic CONTENT to the current code defaults.
 *
 * Overwrites the stored siteSettings, homepage and testimonials, and refreshes
 * the default services — using the SAME store methods the app uses, so the
 * shapes match exactly. It NEVER touches the leads/queries or media collections.
 *
 * Requires MONGODB_URI (the SAME connection string the live site/Render uses).
 * It hard-refuses to run without it, so it can never accidentally write to the
 * local JSON fallback and report a false success. Run from backend/:
 *     npm run reseed
 *
 * The live site reflects these on the next request (pages are force-dynamic —
 * no redeploy needed).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  initStore,
  setContent,
  listTestimonials,
  deleteTestimonial,
  createTestimonial,
  getServiceBySlug,
  updateService,
  createService,
  getStats,
} from '../src/store/index.js';
import { siteSettingsDefaults } from '../src/data/siteDefaults.js';
import { homepageDefaults } from '../src/data/homepageDefaults.js';
import { testimonialsDefaults } from '../src/data/testimonialsDefaults.js';
import { servicesDefaults } from '../src/data/servicesDefaults.js';

async function main() {
  // ── Guard: never run against the JSON fallback ──────────────────────────────
  if (!process.env.MONGODB_URI) {
    console.error('\n✗ MONGODB_URI is not set — refusing to run.');
    console.error('  This script MUST target production MongoDB. Without MONGODB_URI the store would');
    console.error('  fall back to the local JSON file (backend/data/*.json), which would NOT update the');
    console.error('  live site and would look like a false success.');
    console.error('\n  Fix: add this line to backend/.env (the same value your Render backend uses):');
    console.error('      MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/DBNAME?retryWrites=true&w=majority');
    console.error('  then run:  npm run reseed\n');
    process.exit(1);
  }

  await initStore(); // connects to Mongo (guarded above)
  const { host, name: dbName } = mongoose.connection;
  console.log(`\n✔ Connected to MongoDB → host=${host} db=${dbName}\n`);

  // ── Safety snapshot: leads/queries must be identical before & after ─────────
  const leadsBefore = (await getStats()).total;
  console.log(`ℹ  Leads/queries BEFORE: ${leadsBefore} (must be unchanged at the end)\n`);

  // 1) siteSettings — overwrite with new code defaults (new phone, etc.)
  await setContent('siteSettings', siteSettingsDefaults);
  console.log('✔ siteSettings updated:');
  console.log(`    phone   : ${siteSettingsDefaults.phonePrimary}  (tel: ${siteSettingsDefaults.phonePrimaryTel})`);
  console.log(`    email   : ${siteSettingsDefaults.email}`);
  console.log(`    coverage: ${siteSettingsDefaults.coverage}`);
  console.log(`    years   : ${siteSettingsDefaults.yearsExperience}`);

  // 2) homepage — overwrite with new code defaults (new stats)
  await setContent('homepage', homepageDefaults);
  console.log('✔ homepage updated:');
  console.log(`    stats : ${homepageDefaults.stats.map((s) => `${s.value}${s.suffix} ${s.label}`).join('  ·  ')}`);
  console.log(`    trust : ${homepageDefaults.trust.map((t) => t.label).join(', ')}`);

  // 3) testimonials — REPLACE all with the 3 code defaults
  const existingT = await listTestimonials();
  for (const t of existingT) await deleteTestimonial(t.id);
  const created = [];
  for (const t of testimonialsDefaults) created.push(await createTestimonial(t));
  console.log(`✔ testimonials replaced → deleted ${existingT.length}, inserted ${created.length}:`);
  created.forEach((t, i) => console.log(`    ${i + 1}. ${t.authorName} · ${t.company}`));

  // 4) services — refresh the default slugs to current copy/images.
  //    Match by SLUG so _id and slug are preserved (no route breakage), and
  //    never delete services that aren't in the defaults.
  let refreshed = 0;
  let addedSvc = 0;
  for (const def of servicesDefaults) {
    const existing = await getServiceBySlug(def.slug);
    if (existing) {
      await updateService(existing.id, def);
      refreshed += 1;
      console.log(`✔ service refreshed → /services/${def.slug}  ("${def.title}")`);
    } else {
      await createService(def);
      addedSvc += 1;
      console.log(`✔ service created   → /services/${def.slug}  ("${def.title}")`);
    }
  }
  console.log(`✔ services: ${refreshed} refreshed, ${addedSvc} created (any custom services left untouched)`);

  // ── Verify leads untouched ──────────────────────────────────────────────────
  const leadsAfter = (await getStats()).total;
  const leadsOk = leadsAfter === leadsBefore;
  console.log(`\nℹ  Leads/queries AFTER: ${leadsAfter}  →  ${leadsOk ? 'UNCHANGED ✓ (leads NOT touched)' : '⚠ CHANGED — investigate!'}`);

  await mongoose.disconnect();
  console.log('\n✔ Done. Connection closed.');
  console.log('  The live site will show these on the next page load (force-dynamic — no redeploy needed).\n');
  process.exit(leadsOk ? 0 : 2);
}

main().catch(async (err) => {
  console.error('\n✗ Re-seed FAILED:', err?.stack || err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
