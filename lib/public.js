// What the public website may see. Built from an explicit list of fields, never "settings minus secrets",
// so a field added to Bot Studio later stays private until someone adds it here on purpose.
import { housePhotos } from "./bot.js";

const t = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const HOUSE_FIELDS = ["name", "project", "area", "town", "status", "lotArea", "floorArea", "bedrooms", "bathrooms", "features", "asOf"];
const OPTION_FIELDS = ["financing", "price", "reservation", "monthly", "term"];
const MONEY = ["price", "reservation", "monthly"];

export const slugify = (v) => t(v).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// Houses for the website: no blank names, no notes (they mix customer and internal text), no bot settings.
// When the owner chose "an agent gives prices" in Bot Studio, the website shows no amounts either.
export function publicHouses(settings = {}) {
  const shareMoney = settings.pricing !== "agent";
  const used = new Set();
  return (Array.isArray(settings.houses) ? settings.houses : [])
    .filter((h) => t(h?.name))
    .map((h) => {
      const house = Object.fromEntries(HOUSE_FIELDS.map((k) => [k, t(h[k], k === "features" ? 1000 : 300)]));
      if (!["available", "few units left", "sold out"].includes(house.status)) house.status = "available";
      house.photos = housePhotos(h);
      house.options = (Array.isArray(h.options) ? h.options : [])
        .map((o) => Object.fromEntries(OPTION_FIELDS.map((k) => [k, shareMoney || !MONEY.includes(k) ? t(o?.[k], 100) : ""])))
        .filter((o) => OPTION_FIELDS.some((k) => o[k]));
      let slug = slugify(`${house.name} ${house.project}`) || "house";
      for (let n = 2; used.has(slug); n++) slug = `${slugify(`${house.name} ${house.project}`)}-${n}`;
      used.add(slug);
      house.slug = slug;
      return house;
    });
}
