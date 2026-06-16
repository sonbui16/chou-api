import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT ?? 4000

app.listen(PORT, () => {
  console.log(`✅ chou-api đang chạy tại http://localhost:${PORT}`)
})
