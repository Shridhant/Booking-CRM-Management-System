import { db } from "./config/db"

async function run() {
  try {
    const res = await db.query(`
      SELECT id, name, logo_media_id, cover_media_id 
      FROM businesses
    `)
    console.log("Businesses in Database:")
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (err) {
    console.error("Error checking db:", err)
  } finally {
    await db.end()
  }
}

run()
