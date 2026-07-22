import BandProfileClient from "./BandProfileClient";

async function getBandData(slug) {
  if (!slug) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.includes("localhost")) return null;
  try {
    const res = await fetch(`${apiUrl}/api/bands/by-slug/${slug}`, {
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
  const band = await getBandData(slug);

  if (!band) {
    return {
      title: "Aourum - Banda",
      description: "Escucha y descubre las bandas locales en Aourum."
    };
  }

  return {
    title: `Aourum - Banda: ${band.name}`,
    description: band.description || `Perfil musical de ${band.name} en Aourum.`,
    openGraph: {
      title: `Aourum - Banda: ${band.name}`,
      description: band.description || `Perfil musical de ${band.name}`,
      images: band.image ? [{ url: band.image }] : []
    }
  };
}

export default async function BandProfilePage({ params }) {
  const unwrappedParams = await params;
  const band = await getBandData(unwrappedParams?.slug);

  return <BandProfileClient initialBand={band} />;
}
