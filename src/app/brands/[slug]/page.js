import BrandProfileClient from "./BrandProfileClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Obtener datos de la marca en el servidor
async function getBrandData(slug) {
  try {
    const res = await fetch(`${API_URL}/api/brands/by-slug/${slug}`, {
      next: { revalidate: 15 } // Revalidar cada 15 segundos
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error al obtener datos de marca para SSR:", err);
    return null;
  }
}

// Generación de metadatos dinámicos para SEO
export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const brand = await getBrandData(unwrappedParams.slug);

  if (!brand) {
    return {
      title: "Aourum - Marca no encontrada",
      description: "La marca solicitada no existe o no está disponible en la vitrina Aourum."
    };
  }

  return {
    title: `Aourum - ${brand.name}`,
    description: brand.description || `Explora los productos y creaciones exclusivas de ${brand.name} en Aourum.`,
    openGraph: {
      title: `Aourum - ${brand.name}`,
      description: brand.description || `Vitrina exclusiva de ${brand.name}`,
      images: brand.logo ? [{ url: brand.logo }] : []
    }
  };
}

export default async function BrandProfilePage({ params }) {
  const unwrappedParams = await params;
  const brand = await getBrandData(unwrappedParams.slug);

  return <BrandProfileClient params={params} initialBrand={brand} />;
}
