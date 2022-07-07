import React from 'react'
import { createRoot } from 'react-dom/client'
import { csv } from 'd3-fetch'

import Map from './Map'

import './style.css'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<Map />)

const DATA_URL = 'https://gist.githubusercontent.com/beljun/8892e1edf6efb557f7a97f4a560cf61d/raw/433152c15dce5a2ed4003eae6933f9e7623c22d8/geoplay-30mins-3days.csv'
csv(DATA_URL).then((res) => {
  if (res.length > 0) {
    const data = res
    .map(row => ({
      timestamp: new Date(`${row.DateTime.replace(/-/g, '/')}`).getTime(),
      latitude: Number(row.Latitude),
      longitude: Number(row.Longitude),
      magnitude: Number(row.Magnitude)
    }))

    root.render(<Map data={data} />)
  }
})