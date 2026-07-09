export default async function sitemap() {
  const baseUrl = "https://aourum.com";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://tu-backend-api.up.railway.app";

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bands`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fairs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Fetch dynamic brands
  try {
    const brands = await fetch(`${apiUrl}/api/brands`, { next: { revalidate: 3600 } })
      .then(res => res.json())
      .catch(() => []);
    if (Array.isArray(brands)) {
      brands.forEach(brand => {
        if (brand.slug || brand.id) {
          routes.push({
            url: `${baseUrl}/brands/${brand.slug || brand.id}`,
            lastModified: new Date(brand.updatedAt || brand.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      });
    }
  } catch (e) {
    console.error("Sitemap: Failed to load brands", e);
  }

  // Fetch dynamic bands
  try {
    const bands = await fetch(`${apiUrl}/api/bands`, { next: { revalidate: 3600 } })
      .then(res => res.json())
      .catch(() => []);
    if (Array.isArray(bands)) {
      bands.forEach(band => {
        if (band.slug || band.id) {
          routes.push({
            url: `${baseUrl}/bands/${band.slug || band.id}`,
            lastModified: new Date(band.updatedAt || band.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      });
    }
  } catch (e) {
    console.error("Sitemap: Failed to load bands", e);
  }

  // Fetch dynamic products
  try {
    const products = await fetch(`${apiUrl}/api/products`, { next: { revalidate: 3600 } })
      .then(res => res.json())
      .catch(() => []);
    if (Array.isArray(products)) {
      products.forEach(product => {
        if (product.slug || product.id) {
          routes.push({
            url: `${baseUrl}/products/${product.slug || product.id}`,
            lastModified: new Date(product.updatedAt || product.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      });
    }
  } catch (e) {
    console.error("Sitemap: Failed to load products", e);
  }

  // Fetch dynamic fairs
  try {
    const fairs = await fetch(`${apiUrl}/api/fairs`, { next: { revalidate: 3600 } })
      .then(res => res.json())
      .catch(() => []);
    if (Array.isArray(fairs)) {
      fairs.forEach(fair => {
        if (fair.slug || fair.id) {
          routes.push({
            url: `${baseUrl}/fairs/${fair.slug || fair.id}`,
            lastModified: new Date(fair.updatedAt || fair.createdAt || new Date()),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      });
    }
  } catch (e) {
    console.error("Sitemap: Failed to load fairs", e);
  }

  return routes;
}
