/**
 * Generates a URL-safe slug from a business name.
 * Appends a short random suffix to ensure uniqueness.
 *
 * Example: "Glamour Salon & Spa" → "glamour-salon-spa-k3f9"
 */
export const generateSlug = (name: string): string => {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
        .replace(/\s+/g, "-")            // spaces to hyphens
        .replace(/-+/g, "-")             // collapse multiple hyphens

    const suffix = Math.random().toString(36).substring(2, 6) // e.g. "k3f9"

    return `${base}-${suffix}`
}