import BrandProfileClient from "./BrandProfileClient";

async function getBrandData(slug) {
  if (!slug) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.includes("localhost")) return null;
  try {
    const res = await fetch(`${apiUrl}/api/brands/by-slug/${slug}`, {
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 15 }
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
  const brand = await getBrandData(slug);

  if (!brand) {
    return {
      title: "Aourum - Marca",
      description: "Explora las creaciones y catálogo de marcas locales en Aourum."
    };
  }

  return {
    title: `Aourum - ${brand.name}`,
    description: brand.description || `Explora los productos de ${brand.name} en Aourum.`,
    openGraph: {
      title: `Aourum - ${brand.name}`,
      description: brand.description || `Vitrina de ${brand.name}`,
      images: brand.logo ? [{ url: brand.logo }] : []
    }
  };
}

export default async function BrandProfilePage({ params }) {
  const unwrappedParams = await params;
  const brand = await getBrandData(unwrappedParams?.slug);

  return <BrandProfileClient initialBrand={brand} />;
}
