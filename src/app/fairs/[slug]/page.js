import FairProfileClient from "./FairProfileClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Obtener datos de la feria en el servidor
async function getFairData(slug) {
  try {
    const res = await fetch(`${API_URL}/api/fairs/by-slug/${slug}`, {
      next: { revalidate: 15 } // Revalidar cada 15 segundos
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error al obtener datos de feria para SSR:", err);
    return null;
  }
}

// Generación de metadatos dinámicos para SEO
export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const fair = await getFairData(unwrappedParams.slug);

  if (!fair) {
    return {
      title: "Aourum - Feria no encontrada",
      description: "La feria cultural o comercial solicitada no existe o no está disponible en Aourum."
    };
  }

  return {
    title: `Aourum - Feria: ${fair.name}`,
    description: fair.description || `Infórmate sobre fechas, ubicación (${fair.location}) y marcas participantes en la feria ${fair.name} en Aourum.`,
    openGraph: {
      title: `Aourum - Feria: ${fair.name}`,
      description: fair.description || `Ubicación: ${fair.location}. Fecha: ${fair.date}`,
      images: fair.banner ? [{ url: fair.banner }] : []
    }
  };
}

export default async function FairProfilePage({ params }) {
  const unwrappedParams = await params;
  const fair = await getFairData(unwrappedParams.slug);

  return <FairProfileClient params={params} initialFair={fair} />;
}
