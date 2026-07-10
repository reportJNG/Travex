# Travex visual asset prompt system

For the complete page-by-page product and implementation specification, use [`TRAVEX_MASTER_BUILD_PROMPT.md`](./TRAVEX_MASTER_BUILD_PROMPT.md). This file remains the dedicated source of truth for image-generation prompts only.

This file is the source of truth for generated Travex website imagery. The supplied `TRAVEX brand identity.png` is always a **palette and mood reference**, never an edit target. Generated photos must not reproduce its logo, text, mockups, page layout, or circle arrangement.

## Shared visual direction

- Brand colors: ink `#222C4F`, teal `#54B0A4`, sky `#5E9CCD`, violet `#9C72BE`, coral `#EA7C73`, amber `#F5C07E`.
- Positioning: premium, trustworthy Algerian B2B hospitality; contemporary but grounded in real local materials and architecture.
- Photography: photorealistic editorial travel/hospitality imagery with believable texture and slight natural imperfection.
- Local detail: restrained North African geometry, Mediterranean light, pale stone, warm wood, navy shadow, teal glass/water, coral-amber highlights.
- Always avoid: generated text, logos, watermarks, fake hotel names, fantasy landmarks, impossible geometry/reflections, neon, and heavy oversaturation.
- Generated hotel photos are generic illustrative/demo media. Real marketplace listings must use partner-uploaded photography.

## Final assets

### Home hero

- Output: `/public/media/travex-home-hero.webp`
- Mobile crop: `/public/media/travex-home-hero-mobile.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: Travex landing page hero photograph
Primary request: a premium panoramic aerial photograph of Algiers, Algeria, showing the Mediterranean bay, layered white hillside architecture, waterfront boulevard, and refined contemporary travel atmosphere.
Style/medium: photorealistic editorial destination photography, believable Algerian architecture and geography, natural material texture, no CGI look.
Composition/framing: cinematic wide landscape composition; densest city detail toward the right half and calmer darker sea and sky on the left half for website headline readability; strong depth and a clean horizon.
Lighting/mood: blue hour transitioning into warm sunset, sophisticated and trustworthy, with subtle teal, navy, coral, and amber notes from the Travex palette.
Constraints: no foreground people, readable signs, logos, brand mark, text, watermark, fantasy buildings, oversaturated neon, or duplicated structures.
```

### About hero

- Output: `/public/media/travex-about-hero.webp`
- Mobile crop: `/public/media/travex-about-hero-mobile.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: Travex About page hero photograph
Primary request: a premium panoramic destination photograph of Oran, Algeria, with its Mediterranean coastline, white and sand-colored architecture, hillside depth, and a subtle sense of modern business travel.
Style/medium: photorealistic editorial travel photography, geographically believable, natural architectural detail and atmosphere, no CGI look.
Composition/framing: wide landscape with calmer open sky and coastline on the left for page copy, city texture building toward the right, clean horizon and layered depth.
Lighting/mood: soft early-morning golden light, optimistic and refined, with subtle teal-blue water, coral warmth, and navy shadow tones.
Constraints: no foreground crowds, readable signs, logos, text, watermark, fantasy landmarks, oversaturated colors, or duplicated buildings.
```

### Authentication lobby

- Output: `/public/media/travex-auth-lobby.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: Travex login and registration side-panel photograph
Primary request: an elegant contemporary Algerian hotel lobby for business travelers, combining restrained North African geometric craftsmanship with modern international hospitality.
Scene/backdrop: double-height reception space, carved geometric screens, pale stone, warm wood, tasteful seating, and subtle indoor greenery.
Composition/framing: vertical-friendly interior crop with architectural interest and a calm lower-left area for overlaid copy; straight vertical lines, eye-level camera.
Lighting/mood: warm late-afternoon daylight with cool navy shadows and subtle Travex teal, violet, coral, and amber accents.
Constraints: empty calm lobby; no signs, logos, text, watermark, impossible geometry, excessive gold, neon, or oversaturation.
```

### Hotel room

- Output: `/public/media/travex-hotel-room.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: generic Travex hotel listing and room placeholder photograph
Primary request: a refined contemporary hotel guest room in Algeria with crisp linens, pale stone, warm wood, restrained North African geometric textiles, and a soft Mediterranean city-and-sea view.
Composition/framing: horizontal 4:3 composition, bed and seating clearly readable, balanced negative space, eye-level architectural camera.
Lighting/mood: calm morning light; navy, muted teal, soft coral, and amber accents used sparingly.
Constraints: no people, logos, text, watermark, impossible reflections, excessive ornament, neon, or duplicated furniture.
```

### Rooftop pool

- Output: `/public/media/travex-hotel-pool.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: generic Travex hotel pool listing photograph
Primary request: a sophisticated rooftop hotel pool overlooking an Algerian Mediterranean city at dusk.
Scene/backdrop: modern stone pool deck, calm infinity-edge water, restrained loungers and planting, distant white city and coastline.
Composition/framing: horizontal 4:3 composition with the pool as the leading line and uncluttered city view beyond.
Lighting/mood: blue hour with warm architectural lights; elegant navy and teal water with coral and amber sunset reflections.
Constraints: no people, logos, text, watermark, fantasy skyline, impossible water reflections, nightclub neon, or excessive saturation.
```

### Conference suite

- Output: `/public/media/travex-hotel-conference.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: generic Travex hotel conference listing photograph
Primary request: a polished meeting suite inside a contemporary Algerian business hotel, with a wood boardroom table, modern chairs, blank presentation screen, geometric detailing, and tall windows.
Composition/framing: horizontal 4:3 wide view, strong symmetry and practical business layout, screen and table clearly visible without clutter.
Lighting/mood: bright natural daylight with warm ambient light and restrained Travex color accents.
Constraints: no people, readable screen content, logos, text, watermark, impossible geometry, holograms, or excessive ornament.
```

### Hotel exterior

- Output: `/public/media/travex-hotel-exterior.webp`
- Prompt:

```text
Use case: photorealistic-natural
Asset type: generic Travex hotel exterior listing photograph
Primary request: a welcoming contemporary Algerian city hotel combining modern stone, glass, shaded terraces, and restrained local geometric detailing on a clean palm-lined urban street.
Composition/framing: horizontal 4:3 three-quarter exterior view, facade clearly readable, balanced foreground and sky, no dramatic lens distortion.
Lighting/mood: warm late-afternoon sunlight with navy shadow, subtle teal glazing, and coral-amber warmth.
Constraints: no close foreground people, cars blocking the facade, readable hotel name, logos, text, watermark, fantasy architecture, duplicated windows, or neon.
```

## Logo and icon rule

The Travex logo is precision vector artwork, not an image-generation output. Use `/public/brand/travex-mark.svg`, `/public/brand/travex-lockup.svg`, and their light/mono variants. Favicon, touch, maskable, PNG, and social-card derivatives are generated from those SVG masters.
