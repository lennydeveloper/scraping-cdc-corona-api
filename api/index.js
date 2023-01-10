import { Hono } from 'hono'
import dataTracker from '../db/weekly-tracker-data.json'

const app = new Hono()

app.get('/', (ctx) => {
  return ctx.json({
    endpoint: '/data-tracker',
    description: 'Returns the weekly data tracker'
  })
})

app.get('/data-tracker', (ctx) => {
  return ctx.json(dataTracker)
})

export default app
