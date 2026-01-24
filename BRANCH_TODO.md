# Cat Collection Feature - Implementation Plan

## Overview
This plan outlines the implementation of a gamification feature that allows users to collect unique cats for each rehearsal attendance and various achievements/streaks. This feature aims to increase user engagement with the attendance system.

## Current State Analysis

### What Already Exists
- **Cat Generator**: A fully functional cat generator at `/cat-generator` that allows users to create customized demonic cats
  - Unlocked at streak 2 (configurable via `catGenerator.accessStreak`)
  - Customization unlocks at streak 4
  - Export unlocks at streak 5
  - Rare traits unlock at streak 7
  - Multiple color schemes (12 total, 4 are "rare")
  - Accessories: collar, crown
  - Configurable properties: horn style, eye color, flame intensity, pose, markings, expression, and granular sliders
  - SVG-based rendering via `HellCat` component

- **User Data Structure** (`SupabaseUser` in `schema.ts`):
  - Tracks responses per event
  - Maintains `responseStreak` and `maxStreak`
  - Has `streakUpdates` array for history

- **Telemetry**: Already tracks cat generator usage via `cat_generator_telemetry` table

### Gap Analysis
The current system allows users to *create* cats but not to:
1. **Collect and save** cats automatically upon attendance
2. **View their collection** of past cats
3. **Associate cats with specific events/dates**
4. **Display achievement-based special cats**
5. **Showcase their "personal cat"** (main/favorite)

---

## MVP Scope Definition

### Core Features
1. **Automatic Cat Collection**: Users receive a unique, randomly-generated cat each time they submit attendance
2. **Collection Storage**: Store collected cats in the database with metadata (event, date, rarity)
3. **Collection Display Page**: A new page showing:
   - User's "personal cat" (first cat or selected favorite)
   - Grid of all collected cats
   - Basic stats (total cats, rarest cat, streak achievements)
4. **Call-to-Action (CTA)**: Encourage users to check their collection after submitting attendance

### Out of Scope (Future Iterations)
- Trading cats between users
- Cat evolution/upgrades
- Mini-games with cats
- Social features (sharing, gifting)
- Advanced filtering/sorting of collection
- Cat naming/customization after collection

---

## Database Schema Changes

### Migration 1: `collected_cats` table
**File**: `supabase/migrations/20260125000000_collected_cats.sql`

```sql
-- Table to store user's collected cats
create table if not exists public.collected_cats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text not null, -- SHA256 hash of email (matches users table)
  event_id text not null, -- Event ID format: "YYYY-MM-DD||EventTitle"
  event_date text not null, -- ISO date string
  event_title text not null,
  cat_config jsonb not null, -- Full CatConfig object
  rarity text not null default 'common', -- 'common', 'uncommon', 'rare', 'legendary'
  is_favorite boolean not null default false, -- User can mark one as favorite
  metadata jsonb not null default '{}'::jsonb -- Future extensibility
);

-- Indexes for common queries
create index if not exists collected_cats_user_id_idx 
  on public.collected_cats (user_id);

create index if not exists collected_cats_event_id_idx 
  on public.collected_cats (event_id);

create index if not exists collected_cats_created_at_idx 
  on public.collected_cats (created_at desc);

create index if not exists collected_cats_user_favorite_idx 
  on public.collected_cats (user_id, is_favorite) 
  where is_favorite = true;

-- Ensure only one favorite per user
create unique index if not exists collected_cats_one_favorite_per_user 
  on public.collected_cats (user_id) 
  where is_favorite = true;
```

**Rationale**:
- `user_id` matches existing user identification pattern
- `event_id` allows lookup of which cat was collected for which event
- `cat_config` stores complete `CatConfig` object for rendering
- `rarity` enables future achievement-based special cats
- `is_favorite` allows users to showcase a "personal cat"
- `metadata` provides extensibility without schema changes

---

## Backend Implementation

### 1. Cat Generation Logic
**File**: `src/server/db/catCollection.ts` (new)

```typescript
import { CatConfig } from "../../components/CatGenerator/types";

// Rarity tiers based on streak/achievements
export type CatRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface CollectedCat {
  id: string;
  created_at: string;
  user_id: string;
  event_id: string;
  event_date: string;
  event_title: string;
  cat_config: CatConfig;
  rarity: CatRarity;
  is_favorite: boolean;
  metadata: Record<string, unknown>;
}

// Generate a random cat with rarity-appropriate traits
export function generateRandomCatForCollection(params: {
  streak: number;
  maxStreak: number;
  eventDate: string;
  eventTitle: string;
}): { config: CatConfig; rarity: CatRarity } {
  // Rarity determination based on achievements
  const rarity = determineCatRarity(params);
  
  // Generate config with appropriate traits for rarity
  const config = generateCatConfig(rarity);
  
  return { config, rarity };
}

// Rarity logic:
// - common: default (always possible)
// - uncommon: streak >= 3
// - rare: streak >= 5 OR maxStreak >= 10
// - legendary: maxStreak >= 15 OR milestone events (multiples of 10)
function determineCatRarity(params: {
  streak: number;
  maxStreak: number;
  eventDate: string;
}): CatRarity {
  const { streak, maxStreak } = params;
  
  // Legendary: very rare (2% base, 10% if maxStreak >= 15)
  const legendaryChance = maxStreak >= 15 ? 0.10 : 0.02;
  if (Math.random() < legendaryChance) return 'legendary';
  
  // Rare: less common (5% base, 20% if conditions met)
  const rareChance = (streak >= 5 || maxStreak >= 10) ? 0.20 : 0.05;
  if (Math.random() < rareChance) return 'rare';
  
  // Uncommon: more common (30% if streak >= 3)
  const uncommonChance = streak >= 3 ? 0.30 : 0.15;
  if (Math.random() < uncommonChance) return 'uncommon';
  
  return 'common';
}

function generateCatConfig(rarity: CatRarity): CatConfig {
  // Similar to existing generateRandomCat but with rarity modifiers
  // Rare/legendary cats have higher chance of rare color schemes, 
  // special accessories, and more extreme trait values
}
```

**Key Features**:
- Rarity system based on user streaks/achievements
- Weighted random generation for varied collections
- Extensible for future achievement types

### 2. Database Operations
**File**: `src/server/db/catCollection.ts` (continued)

```typescript
import { supabaseServiceRoleClient } from "../../utils/supabase/serviceRoleClient";

export async function saveCatToCollection(cat: Omit<CollectedCat, 'id' | 'created_at'>): Promise<CollectedCat> {
  const { data, error } = await supabaseServiceRoleClient
    .from('collected_cats')
    .insert([cat])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getUserCatCollection(userId: string): Promise<CollectedCat[]> {
  const { data, error } = await supabaseServiceRoleClient
    .from('collected_cats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getUserFavoriteCat(userId: string): Promise<CollectedCat | null> {
  const { data, error } = await supabaseServiceRoleClient
    .from('collected_cats')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data || null;
}

export async function setFavoriteCat(userId: string, catId: string): Promise<void> {
  // Postgres unique index ensures only one favorite per user
  const { error } = await supabaseServiceRoleClient
    .from('collected_cats')
    .update({ is_favorite: true })
    .eq('user_id', userId)
    .eq('id', catId);
    
  if (error) throw error;
}
```

### 3. Integration with Attendance Submission
**File**: `src/server/trpc/router/google.ts` (modify existing)

**Changes**:
- Add cat collection to `performUpdateCallbacksSerially` in `submitAttendance` mutation
- Generate and save a cat after successful attendance submission

```typescript
// In submitAttendance mutation, after writeResponseRow succeeds:
const userId = generateSupabaseUserId(userEmail);
const catGeneration = generateRandomCatForCollection({
  streak: userData?.responseStreak || 0,
  maxStreak: userData?.maxStreak || 0,
  eventDate,
  eventTitle,
});

await saveCatToCollection({
  user_id: userId,
  event_id: generateSupabaseEventId({ eventDate, eventTitle }),
  event_date: eventDate,
  event_title: eventTitle,
  cat_config: catGeneration.config,
  rarity: catGeneration.rarity,
  is_favorite: false, // User's first cat becomes favorite automatically (handled separately)
  metadata: {},
});
```

### 4. TRPC Router Extension
**File**: `src/server/trpc/router/catCollection.ts` (new)

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { 
  getUserCatCollection, 
  getUserFavoriteCat, 
  setFavoriteCat 
} from "../../db/catCollection";
import { generateSupabaseUserId } from "../../db/schema";

export const catCollectionRouter = router({
  getMyCollection: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.session.user.email;
    if (!userEmail) throw new TRPCError({ code: "UNAUTHORIZED" });
    
    const userId = generateSupabaseUserId(userEmail);
    const collection = await getUserCatCollection(userId);
    const favoriteCat = await getUserFavoriteCat(userId);
    
    return {
      cats: collection,
      favoriteCat,
      stats: {
        totalCats: collection.length,
        rarityCounts: {
          common: collection.filter(c => c.rarity === 'common').length,
          uncommon: collection.filter(c => c.rarity === 'uncommon').length,
          rare: collection.filter(c => c.rarity === 'rare').length,
          legendary: collection.filter(c => c.rarity === 'legendary').length,
        }
      }
    };
  }),
  
  setFavorite: protectedProcedure
    .input(z.object({ catId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userEmail = ctx.session.user.email;
      if (!userEmail) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      const userId = generateSupabaseUserId(userEmail);
      await setFavoriteCat(userId, input.catId);
      
      return { success: true };
    }),
});
```

**File**: `src/server/trpc/router/_app.ts` (modify)

```typescript
import { catCollectionRouter } from "./catCollection";

export const appRouter = router({
  google: googleRouter,
  catCollection: catCollectionRouter, // ADD THIS
});
```

---

## Frontend Implementation

### 1. Cat Collection Page
**File**: `src/pages/cat-collection.tsx` (new)

**Layout**:
```
┌─────────────────────────────────────────┐
│    🔥 אוסף החתולים שלי 🔥               │
│    (My Cat Collection)                  │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐   │
│ │  Personal Cat (Favorite)          │   │
│ │  [Large Cat Preview]              │   │
│ │  "Collected on: 2026-01-15"       │   │
│ │  Rarity: ✨ Rare                   │   │
│ └───────────────────────────────────┘   │
│                                          │
│ 📊 Stats:                                │
│ • Total Cats: 12                         │
│ • Common: 6 | Uncommon: 4                │
│ • Rare: 2 | Legendary: 0                 │
│ • Current Streak: 5                      │
│                                          │
│ ┌─── All Collected Cats ──────────┐     │
│ │ [Grid of cat thumbnails]        │     │
│ │  Each with hover → show date     │     │
│ │  Click → enlarge + set favorite  │     │
│ └──────────────────────────────────┘     │
│                                          │
│ 💡 Tip: Keep attending to collect        │
│    rarer cats! Next rare chance at       │
│    streak 7.                             │
└─────────────────────────────────────────┘
```

**Key Components**:
- Grid layout with responsive design (1 col mobile, 3-4 cols desktop)
- Hover states showing cat metadata
- Click to enlarge modal with "Set as Favorite" button
- Rarity indicators (color-coded borders/badges)
- Empty state: "No cats yet! Submit attendance to start collecting 🐱"

**Technical Implementation**:
```typescript
const CatCollection: NextPage = () => {
  const { data: session } = useAppSession();
  const { data: userData } = useUserDbData(session?.user?.email ?? "");
  const { data: collection, isLoading } = trpc.catCollection.getMyCollection.useQuery();
  const setFavoriteMutation = trpc.catCollection.setFavorite.useMutation();
  
  // Component renders HellCat component for each cat in collection
  // Uses existing HellCat.tsx for rendering
  
  return (
    <SessionBoundary>
      <div dir="rtl" className="bg-gradient-shadow min-h-screen">
        {/* Personal Cat Section */}
        {/* Stats Section */}
        {/* Collection Grid */}
      </div>
    </SessionBoundary>
  );
};
```

### 2. Call-to-Action (CTA) Integration

#### 2a. After Attendance Submission
**File**: `src/pages/thank-you.tsx` (modify existing)

Add a prominent CTA after successful submission:
```typescript
<Card className="border-hell-fire/50 bg-gradient-to-br from-hell-ember/20 to-transparent">
  <CardContent className="p-6">
    <div className="flex items-center gap-4">
      <span className="text-4xl">🐱</span>
      <div>
        <h3 className="text-xl font-bold text-hell-glow">
          קיבלת חתול חדש!
        </h3>
        <p className="text-sm text-gray-300">
          חתול ייחודי נוסף לאוסף שלך
        </p>
      </div>
    </div>
    <Link href="/cat-collection">
      <Button className="mt-4 w-full">
        צפה באוסף החתולים שלי
      </Button>
    </Link>
  </CardContent>
</Card>
```

#### 2b. Navigation Menu
**File**: `src/components/Layout.tsx` or navigation component (if exists)

Add link to cat collection in main navigation.

#### 2c. Cat Generator Page Link
**File**: `src/pages/cat-generator.tsx` (modify)

Add a link/button: "View My Collection" that navigates to `/cat-collection`.

### 3. Enhanced Cat Customization Options (Optional Enhancement)

**Evaluation**: Current cat generator has significant variety already:
- 12 color schemes (body, accent, eyes)
- 4 horn styles
- 4 eye colors
- 3 flame intensities
- 3 poses
- 4 marking types
- 4 expressions
- 2 accessories
- 6 granular sliders (eyeGlow, hornSize, tailLength, bodySize, flameHeight, wickedness)

**Recommendation**: **DO NOT ADD** new customization options for MVP
- Current variety is sufficient for visual distinction
- Adding more options increases complexity without proportional value
- Focus on collection mechanics first
- Can revisit in future iterations based on user feedback

**If Enhancement Needed Later**: Consider:
- More accessory types (earrings, bandana, scarf)
- Background variations (flames, smoke, stars)
- Animation states (idle, excited, sleepy)

---

## Testing Strategy

### 1. Backend Tests
**File**: `src/__tests__/server/catCollection.test.ts` (new)

```typescript
describe('catCollection', () => {
  describe('generateRandomCatForCollection', () => {
    it('generates common cats for low streaks', () => {});
    it('generates rare cats for high streaks', () => {});
    it('generates legendary cats occasionally for maxStreak >= 15', () => {});
  });
  
  describe('database operations', () => {
    it('saves cat to collection', () => {});
    it('retrieves user collection', () => {});
    it('sets favorite cat (only one per user)', () => {});
  });
});
```

### 2. TRPC Router Tests
**File**: `src/__tests__/server/trpc/catCollection.test.ts` (new)

```typescript
describe('catCollectionRouter', () => {
  it('getMyCollection requires authentication', () => {});
  it('returns empty collection for new user', () => {});
  it('setFavorite updates favorite cat', () => {});
});
```

### 3. Component Tests
**File**: `src/__tests__/pages/cat-collection.test.tsx` (new)

```typescript
describe('CatCollectionPage', () => {
  it('renders loading state', () => {});
  it('renders empty state for no cats', () => {});
  it('renders cat grid with collection', () => {});
  it('shows favorite cat prominently', () => {});
  it('handles set favorite action', () => {});
});
```

### 4. Integration Tests (Playwright)
**File**: `e2e/cat-collection.spec.ts` (new)

```typescript
test('user collects cat after attendance submission', async ({ page }) => {
  // Submit attendance
  // Verify CTA appears on thank-you page
  // Navigate to collection
  // Verify cat appears in collection
});

test('user can set favorite cat', async ({ page }) => {
  // Navigate to collection
  // Click on a cat
  // Set as favorite
  // Verify it appears in favorite section
});
```

### 5. Migration Tests
**File**: `scripts/db/test-migrations.sh` (existing)

Run: `pnpm db:migrations:check` to verify migration applies cleanly.

---

## Implementation Phases

### Phase 1: Database & Backend (2-3 hours)
- [ ] Create `collected_cats` migration
- [ ] Implement `catCollection.ts` utility functions
- [ ] Create TRPC `catCollectionRouter`
- [ ] Integrate cat generation into attendance submission
- [ ] Write backend unit tests

### Phase 2: Frontend Collection Page (2-3 hours)
- [ ] Create `cat-collection.tsx` page
- [ ] Implement collection grid layout
- [ ] Add favorite cat display
- [ ] Add stats display
- [ ] Handle loading/empty states
- [ ] Write component tests

### Phase 3: CTAs & Navigation (1 hour)
- [ ] Add CTA to thank-you page
- [ ] Add navigation link
- [ ] Add link from cat generator
- [ ] Test user flow end-to-end

### Phase 4: Polish & Testing (1-2 hours)
- [ ] Write integration tests
- [ ] Test on mobile/responsive
- [ ] Verify accessibility (keyboard nav, screen readers)
- [ ] Add telemetry tracking (optional)
- [ ] Update documentation

---

## Future Enhancements (Post-MVP)

### Short-term (Next 2-3 sprints)
1. **Cat Details Modal**: Click cat → show full metadata, event details, QR code for sharing
2. **Filters & Sorting**: Filter by rarity, sort by date/rarity
3. **Achievement Badges**: Special cats for milestones (10th, 25th, 50th attendance)
4. **Cat Stats Page**: Analytics on collection (most common rarity, longest collecting streak)

### Medium-term (Next quarter)
1. **Special Event Cats**: Holiday-themed cats (Hanukkah, Purim) with unique traits
2. **Cat Naming**: Allow users to name their favorite cat
3. **Social Sharing**: Share cat images to social media
4. **Collection Challenges**: "Collect all 12 color schemes" achievements

### Long-term (Future quarters)
1. **Trading System**: Trade duplicate cats with other users
2. **Cat Evolution**: Merge duplicate cats to "evolve" them
3. **Cat Battles**: Mini-game using collected cats
4. **NFT Integration**: Export cats as blockchain collectibles (if desired)

---

## Technical Considerations

### Performance
- **Database**: Index on `user_id` and `created_at` for fast queries
- **Frontend**: Lazy load images if collection grows large (virtual scrolling)
- **Caching**: TRPC query caching for collection data

### Accessibility
- **Keyboard Navigation**: All interactive elements keyboard-accessible
- **Screen Readers**: Proper ARIA labels on cats and rarity indicators
- **Color Contrast**: Ensure rarity indicators have sufficient contrast

### Internationalization (Hebrew RTL)
- Already handled by `dir="rtl"` on page containers
- Ensure new components respect RTL layout

### Security
- **Authorization**: All TRPC procedures use `protectedProcedure`
- **User Isolation**: User can only access their own collection
- **Input Validation**: Zod schemas for all inputs

### Monitoring
- **Sentry**: Capture exceptions in cat generation/storage
- **Telemetry**: Track collection page views, favorite changes
- **Metrics**: Monitor collection growth rate, rarity distribution

---

## Success Metrics

### Engagement
- **Primary**: % increase in attendance submissions after feature launch
- **Secondary**: % of users who visit collection page within 7 days of launch
- **Tertiary**: Average number of collection page visits per user per week

### Technical
- **Performance**: Collection page loads in <2s on 3G
- **Reliability**: <0.1% error rate on cat generation/storage
- **Adoption**: >50% of active users collect at least 3 cats in first month

---

## Risks & Mitigations

### Risk 1: Database growth
**Impact**: Collection table grows indefinitely
**Mitigation**: 
- Index-optimized queries
- Future: Archive old cats (>1 year) to separate table
- Estimated storage: ~1KB per cat → 1M cats = 1GB (manageable)

### Risk 2: Rarity balance
**Impact**: Too many/too few rare cats affects engagement
**Mitigation**:
- Make rarity thresholds configurable in `app_config`
- Monitor rarity distribution via telemetry
- Adjust probabilities post-launch if needed

### Risk 3: User confusion
**Impact**: Users don't understand collection feature
**Mitigation**:
- Clear onboarding (CTA on thank-you page)
- Tooltip/help text explaining rarity
- Empty state with clear next steps

### Risk 4: Performance on large collections
**Impact**: Slow loading for users with 100+ cats
**Mitigation**:
- Pagination (show 50 cats per page)
- Virtual scrolling for large collections
- Image optimization (SVG is lightweight)

---

## Rollback Plan

If issues arise post-launch:

1. **Feature Flag**: Add `catCollection.enabled` to `app_config` (like cat generator's `rolloutPaused`)
2. **Disable Collection**: Set flag to pause new cat generation
3. **Database**: Keep migration in place (no rollback needed)
4. **Frontend**: Show maintenance message on collection page

---

## Dependencies

### External
- None (all features use existing dependencies)

### Internal
- Existing `HellCat` component for rendering
- Existing `protectedProcedure` for auth
- Existing Supabase connection
- Existing telemetry infrastructure (if tracking added)

---

## Approval Checklist

Before proceeding with implementation, confirm:
- [ ] MVP scope is appropriate (not too large/small)
- [ ] Database schema meets requirements
- [ ] Rarity system is balanced and fair
- [ ] UI mockup is engaging and clear
- [ ] Testing strategy is comprehensive
- [ ] Timeline is realistic (6-9 hours total)
- [ ] Success metrics are measurable

---

## Questions for Stakeholder Review

1. **Rarity Balance**: Are the rarity thresholds (uncommon at streak 3, rare at 5/10, legendary at 15) appropriate?
2. **Favorite Cat**: Should favorite cat be manually selected or auto-set to first/rarest cat?
3. **Customization**: Do we need additional cat customization options, or is current variety sufficient?
4. **Social Features**: Should cat collection be private or allow sharing/viewing other users' collections?
5. **Achievement Cats**: Should special milestone attendances (10th, 50th) grant guaranteed legendary cats?
6. **Naming**: Should users be able to name their cats in MVP or defer to later?
7. **Telemetry**: Should we track detailed collection behavior (views, favorites, rarity distribution)?

---

## Conclusion

This plan provides a clear, scoped MVP for cat collection that:
- ✅ Leverages existing cat generator infrastructure
- ✅ Adds minimal new code (database operations, TRPC router, one new page)
- ✅ Provides clear engagement hooks (CTA, stats, rarity)
- ✅ Is fully testable with existing test infrastructure
- ✅ Has a clear path for future enhancements
- ✅ Minimizes risks with feature flags and rollback plan

**Estimated Implementation Time**: 6-9 hours (one full day of focused work)

**Recommended Next Steps**:
1. Review and approve this plan
2. Confirm answers to stakeholder questions
3. Create issues/tasks for each phase
4. Begin implementation starting with Phase 1 (Database & Backend)
