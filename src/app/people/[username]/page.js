import PersonProfileClient from "./PersonProfileClient";

export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const username = unwrappedParams?.username || "";
  return {
    title: `Aourum - Perfil de ${username}`,
    description: `Explora el perfil, publicaciones y cuentas vinculadas de ${username} en Aourum.`
  };
}

export default async function PersonProfilePage() {
  return <PersonProfileClient />;
}
