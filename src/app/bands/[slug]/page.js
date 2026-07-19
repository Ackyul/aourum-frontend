import BandProfileClient from "./BandProfileClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Obtener datos de la banda en el servidor
async function getBandData(slug) {
  try {
    const res = await fetch(`${API_URL}/api/bands/by-slug/${slug}`, {
      next: { revalidate: 15 } // Revalidar cada 15 segundos
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error al obtener datos de banda para SSR:", err);
    return null;
  }
}

// Generación de metadatos dinámicos para SEO
export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const band = await getBandData(unwrappedParams.slug);

  if (!band) {
    return {
      title: "Aourum - Banda no encontrada",
      description: "La banda o agrupación musical solicitada no existe o no está disponible en Aourum."
    };
  }

  return {
    title: `Aourum - Banda: ${band.name}`,
    description: band.description || `Escucha los lanzamientos y presentaciones de la banda ${band.name} en Aourum.`,
    openGraph: {
      title: `Aourum - Banda: ${band.name}`,
      description: band.description || `Perfil musical de ${band.name}`,
      images: band.image ? [{ url: band.image }] : []
    }
  };
}

export default async function BandProfilePage({ params }) {
  const unwrappedParams = await params;
  const band = await getBandData(unwrappedParams.slug);

  return <BandProfileClient params={params} initialBand={band} />;
}
