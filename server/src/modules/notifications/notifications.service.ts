import { db } from "../../config/db"

export interface CreateNotificationInput {
  user_id: string
  title: string
  message: string
  type: string
  related_entity_type?: string
  related_entity_id?: string
}

export const createNotification = async (input: CreateNotificationInput) => {
  const result = await db.query(
    `INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      status,
      sent_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'unread', NOW())
    RETURNING *`,
    [
      input.user_id,
      input.title,
      input.message,
      input.type,
      input.related_entity_type || null,
      input.related_entity_id || null,
    ]
  )
  return result.rows[0]
}
