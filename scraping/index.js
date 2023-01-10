import * as cheerio from 'cheerio'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const URLS = {
  'weekly-tracker': 'https://www.cdc.gov/coronavirus/2019-ncov/covid-data/covidview/index.html',
  'home-tracker': 'https://covid.cdc.gov/covid-data-tracker/#datatracker-home',
  'vaccinations-tracker': 'https://covid.cdc.gov/covid-data-tracker/#vaccinations_vacc-people-booster-percent-pop5'
}

const weeklyTrackerData = {
  reportedCases: [
    'total-cases-reported',
    'current-7day-average',
    'previous-7day-average',
    'change-in-7day-average'
  ],
  vaccinations: [
    'vaccione-doses-administered',
    'updated-booster-doses-administered',
    'primary-series-completed',
    'updated-booster-received',
    'percentage-point-change-from-last-week',
    'updated-booster-percentage-point-change-from-last-week'
  ],
  hospitalizations: [
    'total-new-admissions',
    'current-7day-average',
    'prior-7day-average',
    'change-in-7day-average'
  ],
  deaths: [
    'total-deaths-reported',
    'current-7day-average',
    'prior-7day-average',
    'change-in-7day-average'
  ],
  testing: [
    'total-tests-reported',
    '7day-average-tests-reported',
    '7day-average-positivity',
    'previous-7day-average-positivity',
    'percentage-point-change-in-7day-average'
  ]
}

function getMapValue ({ selectorValues, values }) {
  const arr = values.map((el, idx) => {
    const index = el.indexOf(' ')
    const result = el.substring(0, index)

    return [selectorValues[idx], result]
  })

  const mapValues = Object.fromEntries(arr)
  return mapValues
}

async function scrape (url) {
  const res = await fetch(url)
  const html = await res.text()
  return cheerio.load(html)
}

async function getWeeklyTrackerData () {
  const data = []
  const $ = await scrape(URLS['weekly-tracker'])
  const rows = $('div.cdc-textblock')

  const cleanText = text => text
    .replace('\n', ' ')

  rows.each((_, el) => {
    const $el = $(el)

    const text = $el.find('p').text().trim()
    const cleanData = cleanText(text)

    if (cleanData.charAt(0).match('[+0-9]')) data.push(cleanData)
  })

  const reportedCases = data.slice(0, 4)
  const vaccinations = data.slice(4, 10)
  const hospitalizations = data.slice(10, 14)
  const deaths = data.slice(14, 18)
  const testing = data.slice(18, 23)

  const arr = [reportedCases, vaccinations, hospitalizations, deaths, testing]
  const trackerKeys = Object.keys(weeklyTrackerData)

  const parseData = trackerKeys.map((el, idx) => {
    const selectorValues = weeklyTrackerData[el]
    return getMapValue({ selectorValues, values: arr[idx] })
  })

  return parseData
}

const weeklyTrackerParseData = await getWeeklyTrackerData()

const filePath = path.join(process.cwd(), './db/weekly-tracker-data.json')
await writeFile(filePath, JSON.stringify(weeklyTrackerParseData, null, 2), 'utf-8')
