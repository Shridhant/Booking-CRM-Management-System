import { db } from "../../config/db"

export interface Promotion {
  id: string
  title: string
  desktop_media_id: string
  mobile_media_id: string
  redirect_slug: string
  is_active: boolean
  sort_order: number
  created_at: Date
  updated_at: Date
  desktop_url?: string
  mobile_url?: string
}

export const listActivePromotions = async (): Promise<Promotion[]> => {
  const query = `
    SELECT 
      p.*,
      md.url AS desktop_url,
      mm.url AS mobile_url
    FROM public.promotions p
    LEFT JOIN public.media md ON p.desktop_media_id = md.id
    LEFT JOIN public.media mm ON p.mobile_media_id = mm.id
    WHERE p.is_active = true
    ORDER BY p.sort_order ASC, p.created_at DESC
  `
  const result = await db.query(query)
  return result.rows
}

export const listAllPromotions = async (): Promise<Promotion[]> => {
  const query = `
    SELECT 
      p.*,
      md.url AS desktop_url,
      mm.url AS mobile_url
    FROM public.promotions p
    LEFT JOIN public.media md ON p.desktop_media_id = md.id
    LEFT JOIN public.media mm ON p.mobile_media_id = mm.id
    ORDER BY p.sort_order ASC, p.created_at DESC
  `
  const result = await db.query(query)
  return result.rows
}

export const createPromotion = async (data: {
  title: string
  desktop_media_id: string
  mobile_media_id: string
  redirect_slug: string
  sort_order?: number
}): Promise<Promotion> => {
  const query = `
    INSERT INTO public.promotions 
      (title, desktop_media_id, mobile_media_id, redirect_slug, sort_order)
    VALUES 
      ($1, $2, $3, $4, COALESCE($5, 0))
    RETURNING *
  `
  const result = await db.query(query, [
    data.title,
    data.desktop_media_id,
    data.mobile_media_id,
    data.redirect_slug,
    data.sort_order !== undefined ? data.sort_order : 0
  ])
  return result.rows[0]
}

export const updatePromotion = async (
  id: string,
  data: Partial<{
    title: string
    desktop_media_id: string
    mobile_media_id: string
    redirect_slug: string
    is_active: boolean
    sort_order: number
  }>
): Promise<Promotion | null> => {
  // Build dynamic update query fields
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined) {
      fields.push(`"${key}" = $${paramIndex}`)
      values.push(val)
      paramIndex++
    }
  })

  if (fields.length === 0) return null

  // Append updated_at
  fields.push(`"updated_at" = now()`)

  const query = `
    UPDATE public.promotions 
    SET ${fields.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
  `
  values.push(id)

  const result = await db.query(query, values)
  return result.rows[0] || null
}

export const deletePromotion = async (id: string): Promise<boolean> => {
  const query = `
    DELETE FROM public.promotions
    WHERE id = $1
  `
  const result = await db.query(query, [id])
  return (result.rowCount ?? 0) > 0
}
