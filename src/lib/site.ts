export const site = {
  name: "Yana Chocolateria",
  tagline: "Chocolate Excellence | Mouthwatering | The perfect gift",
  description:
    "Family-owned Philippine chocolatier crafting premium couverture chocolate, sweet treats, desserts and drinks from the finest Philippine cacao.",
  email: "yanachocolateria23@gmail.com",
  phone: "+63-2-70001974",
  phoneHref: "tel:+63270001974",
  socials: [
    { name: "Facebook", href: "https://facebook.com/yanachocolateria" },
    { name: "Instagram", href: "https://instagram.com/yanachocolateria" },
    { name: "TikTok", href: "https://tiktok.com/@yanachocolateria" },
    { name: "YouTube", href: "https://youtube.com/yanachocolateria" },
  ],
};

export type Branch = { id: string; name: string; place: string; address: string };

export const branches: Branch[] = [
  {
    id: "paranaque-ups5",
    name: "Yana Chocolateria",
    place: "Erwincel Bldg, Parañaque",
    address: "Unit A2 Erwincel Bldg, Filipinas Ave., UPS 5, San Isidro, Parañaque, Metro Manila",
  },
  {
    id: "sm-bf-paranaque",
    name: "Everything Chocolate",
    place: "SM City BF Parañaque",
    address: "SM City BF Parañaque, Dr Arcadio Santos Ave, Parañaque, Metro Manila",
  },
];

// Branches customers can choose for order pickup.
export const pickupBranches = branches;

export const navCollections = ["pure-chocolate", "sweet-treats", "desserts", "drinks", "chocolate-finds"];
