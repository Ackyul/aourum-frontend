import ProductDetailClient from "./ProductDetailClient";

async function getProductData(slug) {
  if (!slug) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.aourum.com";
  try {
    const res = await fetch(`${apiUrl}/api/products/by-slug/${encodeURIComponent(slug)}`, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 30 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams?.slug || "";
  const product = await getProductData(slug);

  if (!product) {
    return {
      title: "Producto en Aourum",
      description: "Descubre artículos, propuestas y marcas locales independientes en Aourum Marketplace."
    };
  }

  const cleanDescription = (product.description || "")
    .replace(/\[Tamaños:[^\]]*\]/gi, "")
    .replace(/\[Inspiración:[^\]]*\]/gi, "")
    .replace(/\[DuoConfig:[^\]]*\]/gi, "")
    .replace(/\[PuntosVenta:[^\]]*\]/gi, "")
    .trim()
    .slice(0, 160) || `Encuentra ${product.name} en Aourum.`;

  const priceStr = product.price != null ? ` | S/ ${Number(product.price).toFixed(2)}` : "";
  const pageTitle = `${product.name}${priceStr} — Aourum`;

  return {
    title: pageTitle,
    description: cleanDescription,
    openGraph: {
      title: pageTitle,
      description: cleanDescription,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: cleanDescription,
      images: product.image ? [product.image] : []
    }
  };
}

export default async function ProductPage({ params }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams?.slug || "";
  const initialProduct = await getProductData(slug);

  return <ProductDetailClient slug={slug} initialProduct={initialProduct} />;
}
