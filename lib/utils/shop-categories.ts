export type ShopCategory = {
  id: string;
  label: { en: string; fr: string; ar: string };
  icon: string; // emoji fallback — replace with icon component as needed
};

export type ProductCategory = {
  id: string;
  label: { en: string; fr: string; ar: string };
};

export const SHOP_CATEGORIES: ShopCategory[] = [
  { id: "crafts",     icon: "🪡", label: { en: "Crafts & Art",          fr: "Artisanat & Art",       ar: "حرف يدوية وفنون" } },
  { id: "textiles",   icon: "🧵", label: { en: "Textiles",               fr: "Textiles",              ar: "المنسوجات" } },
  { id: "jewelry",    icon: "💍", label: { en: "Jewelry",                fr: "Bijouterie",            ar: "مجوهرات" } },
  { id: "ceramics",   icon: "🏺", label: { en: "Ceramics & Pottery",     fr: "Céramique & Poterie",   ar: "الفخار والخزف" } },
  { id: "food_local", icon: "🫙", label: { en: "Local Food",             fr: "Produits Locaux",       ar: "المنتجات المحلية" } },
  { id: "spices",     icon: "🌿", label: { en: "Spices & Herbs",         fr: "Épices & Herbes",       ar: "توابل وأعشاب" } },
  { id: "leather",    icon: "👜", label: { en: "Leather Goods",          fr: "Maroquinerie",          ar: "منتجات جلدية" } },
  { id: "clothing",   icon: "👘", label: { en: "Traditional Wear",       fr: "Vêtements Traditionnels", ar: "الملابس التقليدية" } },
  { id: "wellness",   icon: "🌸", label: { en: "Wellness & Oils",        fr: "Bien-être & Huiles",    ar: "عطور وزيوت" } },
  { id: "souvenirs",  icon: "🎁", label: { en: "Souvenirs",              fr: "Souvenirs",             ar: "تذكارات" } },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: "crafts",       label: { en: "Crafts",       fr: "Artisanat",   ar: "حرف" } },
  { id: "clothing",     label: { en: "Clothing",     fr: "Vêtements",   ar: "ملابس" } },
  { id: "accessories",  label: { en: "Accessories",  fr: "Accessoires", ar: "إكسسوارات" } },
  { id: "jewelry",      label: { en: "Jewelry",      fr: "Bijoux",      ar: "مجوهرات" } },
  { id: "ceramics",     label: { en: "Ceramics",     fr: "Céramique",   ar: "فخار" } },
  { id: "food_drink",   label: { en: "Food & Drink", fr: "Alimentation",ar: "أغذية ومشروبات" } },
  { id: "wellness",     label: { en: "Wellness",     fr: "Bien-être",   ar: "عافية" } },
  { id: "other",        label: { en: "Other",        fr: "Autre",       ar: "أخرى" } },
];

export function getShopCategoryLabel(
  categoryId: string,
  locale: string
): string {
  const cat = SHOP_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return categoryId;
  return cat.label[locale as keyof typeof cat.label] ?? cat.label.en;
}

export function getProductCategoryLabel(
  categoryId: string,
  locale: string
): string {
  const cat = PRODUCT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return categoryId;
  return cat.label[locale as keyof typeof cat.label] ?? cat.label.en;
}
