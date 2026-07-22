import FairProfileClient from "./FairProfileClient";

async function getFairData(slug) {
  if (!slug) return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.includes("localhost")) return null;
  try {
    const res = await fetch(`${apiUrl}/api/fairs/by-slug/${slug}`, {
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
  const fair = await getFairData(slug);

  if (!fair) {
    return {
      title: "Aourum - Feria",
      description: "Infórmate sobre las ferias culturales y comerciales en Aourum."
    };
  }

  return {
    title: `Aourum - Feria: ${fair.name}`,
    description: fair.description || `Ubicación: ${fair.location}. Fecha: ${fair.date}`,
    openGraph: {
      title: `Aourum - Feria: ${fair.name}`,
      description: fair.description || `Ubicación: ${fair.location}. Fecha: ${fair.date}`,
      images: fair.banner ? [{ url: fair.banner }] : []
    }
  };
}

export default async function FairProfilePage({ params }) {
  const unwrappedParams = await params;
  const fair = await getFairData(unwrappedParams?.slug);

  return <FairProfileClient initialFair={fair} />;
}
