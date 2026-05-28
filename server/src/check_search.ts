import { searchPublicBusinesses } from "./modules/public/public.service"

async function run() {
  try {
    const result = await searchPublicBusinesses({
      page: 1,
      limit: 10,
    })
    console.log("Search Results keys & urls:")
    if (result.items.length > 0) {
      console.log(Object.keys(result.items[0]))
      console.log("Sample Item:", JSON.stringify(result.items[0], null, 2))
    } else {
      console.log("No items found.")
    }
  } catch (err) {
    console.error("Error running search check:", err)
  }
}

run()
