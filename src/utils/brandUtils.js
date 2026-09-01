export function isVirtualMenuBrand(brand) {
  if (!brand) return false;
  let parsedDesc = {};
  if (typeof brand.description === "string" && brand.description.trim().startsWith("{")) {
    try {
      parsedDesc = JSON.parse(brand.description);
    } catch (e) {}
  }
  const brandDesign = brand.brandDesign || parsedDesc.brandDesign || {};
  const catalogDisplayMode = brand.catalogDisplayMode || brandDesign.catalogDisplayMode || parsedDesc.catalogDisplayMode;

  const categoryStr = (brand.category || parsedDesc.rubro_especifico || parsedDesc.rubro_general || "").toLowerCase();
  const isFoodCategory = Boolean(/comida|gastronom|restauran|snack|bebida|infusio|postre|alimento|fruta/i.test(categoryStr));

  return catalogDisplayMode === "menu" || (catalogDisplayMode !== "grid" && isFoodCategory);
}
