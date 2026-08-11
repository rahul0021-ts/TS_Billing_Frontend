// quickAddConfig.js
//
// Manual configuration for the Quick Add page.
// -----------------------------------------------------------------------
// This file is the ONLY place you need to edit to change what products /
// sizes show up for a given quantity. There is no database, no API, and
// no admin UI behind this — the Quick Add page reads this object directly.
//
// HOW IT WORKS
// The top-level keys are quantities (as numbers). When the cashier types
// a quantity into the Quick Add keypad, the page looks up
// `quickAddConfig[quantity]` and shows that quantity's `products` list.
// Each product has its own `sizes` array, shown after the product is
// selected.
//
// HOW TO EDIT
// 1. Add or change a quantity block (e.g. `12: { products: [...] }`).
// 2. Add products with a `name` and a `sizes` array.
// 3. Always keep an "NA" product (falls back to "NA / Free" size) so the
//    cashier always has something to tap even for an unlisted item.
// 4. Save the file and restart the frontend dev server / rebuild.
//
// No restart-free hot config: this is intentional — it keeps the page
// dependency-free and fast, per the "no DB / no API" requirement.
// -----------------------------------------------------------------------

export const quickAddConfig = {
  1: {
    products: [
      { name: "VIP", sizes: ["S", "M", "L", "XL", "XXL", "3XL", "NA / Free"] },
      { name: "3D Print", sizes: ["80", "90", "100"] },
      { name: "3D Plan", sizes: ["80", "90", "100"] },
      { name: "LG", sizes: ["60", "65", "70","75"] },
      { name: "Baniyan", sizes: ["NA / Free"] },
      { name: "Slip", sizes: ["80","85","90","NA / Free"] },
      { name: "Cut-Nikar", sizes: ["80","85","90","100","NA / Free"] },
      { name: "Scarf", sizes: ["NA / Free"] },
      { name: "Nilon", sizes: ["OO","O","S","M","L","BABU","NA / Free"] },
      { name: "Rumal", sizes: ["NA"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
  3: {
    products: [
      { name: "Shirt", sizes: ["26X36", "32X36", "38X40", "20X24","S", "M", "L", "XL", "XXL", "3XL", "NA / Free"] },
      { name: "Pant", sizes: ["28X32","26X30","32X36","38X40", "NA / Free"] },
      { name: "Jenes", sizes: ["28X32","26X30","32X36","38X40", "NA / Free"] },
      { name: "Legi Drees", sizes: ["0", "20X24", "26X30", "32X34", "XL", "XXL", "NA / Free"] },
      { name: "Frok", sizes: ["0", "Free", "Other"] },
      { name: "Jenes", sizes: ["80", "90", "100"] },
      { name: "Top", sizes: ["S", "M", "L","XL","XXl"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
  4: {
    products: [
      { name: "Top", sizes: ["XL", "XXL", "NA / Free"] },
      { name: "Gaun", sizes: ["Feeding", "Free", "Other"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
  5: {
    products: [
      { name: "Yatra", sizes: ["S","M","L", "NA / Free"] },
      { name: "Aarmani", sizes: ["32X40", "Free", "Other"] },
      { name: "Pant", sizes: ["28X36","NA / Free"] },
      { name: "Stall", sizes: ["NA / Free"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
  6: {
    products: [
      { name: "Shirt", sizes: ["26X36", "32X36", "38X40", "20X24","S", "M", "L", "XL", "XXL", "3XL", "NA / Free"] },
      { name: "Pant", sizes: ["28X32","26X30","32X36","38X40", "NA / Free"] },
      { name: "Jenes", sizes: ["28X32","26X30","32X36","38X40", "NA / Free"] },
      { name: "VIP", sizes: ["XL","XXL","NA / Free"] },
      { name: "Night Pant", sizes: ["1-2-3","4-5-6","7-8-9","10-11-12","L", "XL", "XXL", "NA / Free"] },
      { name: "Dhoti", sizes: ["XL", "XXL","32X34","26X30", "NA / Free"] },
      { name: "Sharak", sizes: ["XL","XXL","3XL","4XL","NA / Free"] },
      { name: "Plazo", sizes: ["Free", "XL", "XXL", "NA / Free"] },
      { name: "Parkar", sizes: ["Computer","Single","Jumbo","40-Jumbo","Patti","NA / Free"] },
      { name: "Patta", sizes: ["20","NA / Free"] },
      { name: "Kesmet", sizes: ["16","18","20","NA / Free"] },
      { name: "Towel", sizes: ["36X72", "32X64", "30X60", "NA / Free"] },
      { name: "Heram", sizes: ["M","L","OL","XL","XXL","3XL","S","NA / Free"] },
      { name: "Legi Drees", sizes: ["0", "20X24", "26X30", "32X34", "XL", "XXL", "NA / Free"] },
      { name: "Frok", sizes: ["0", "Free", "Other"] },
      { name: "T-Shirt", sizes: ["20X24","26X30","32X36","38X40","XL","XXL","NA / Free"] },
      { name: "Pant-Shirt", sizes: ["20X30","32X36","NA / Free"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },

  10: {
    products: [
      { name: "Bloomer", sizes: ["85", "90", "95", "100", "NA / Free"] },
      { name: "T-Shirt", sizes: ["S", "M", "L", "XL", "XXL", "NA / Free"] },
      { name: "Cadda", sizes: ["S", "M", "L", "MIX", "NA / Free"] },
      { name: "Stall", sizes: ["S", "M", "L", "XL", "NA / Free"] },
      { name: "Heram", sizes: ["O","S","NA / Free"] },
      { name: "Tipka Chaddi", sizes: ["S","M","L","XL","NA / Free"] },
      { name: "Scarf", sizes: ["NA / Free"] },
      { name: "Uparne", sizes: ["NA / Free"] },
      { name: "Kadak Topi", sizes: ["NA / Free"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },

  12: {
    products: [
      { name: "Towel", sizes: ["30x60", "32x64", "36x72", "NA / Free"] },
      { name: "Bloomer", sizes: ["80", "85","90", "NA / Free"] },
      { name: "Night-Pant", sizes: ["OO","O","S","M","L","XL","XXL", "NA / Free"] },
      { name: "Heram", sizes: ["O","S","NA / Free"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
  25: {
    products: [
      { name: "Blouse Piss", sizes: ["TIP-TOP","Rajvada","Ghugat","Raipur","NA"] },
      { name: "Aasstar", sizes: ["Dollar", "Bani-thani", "NA / Free"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
  50: {
    products: [
      { name: "Blouse Piss", sizes: ["TIP-TOP","Rajvada","Ghugat","Raipur","NA"] },
      { name: "Aasstar", sizes: ["Dollar", "Bani-thani", "NA / Free"] },
      { name: "NA", sizes: ["NA / Free"] },
    ],
  },
};

// Convenience helper — quantities that currently have a configured product
// list. Used by the page to show a friendly hint for unconfigured
// quantities instead of a blank screen.
export const configuredQuantities = Object.keys(quickAddConfig).map(Number);