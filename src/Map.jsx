import React, { useMemo, useState } from 'react'
import { geoToH3 } from 'h3-js'
import { Map as StaticMap } from 'react-map-gl'
import DeckGL from '@deck.gl/react'
import { H3HexagonLayer } from '@deck.gl/geo-layers'

import RangeController from './RangeController'
import { useEffect } from 'react'

const MAPBOX_TOKEN = process.env.MapboxAccessToken

const INITIAL_VIEW_STATE = {
  latitude: 13.68633816416859,
  longitude: 100.52803641807132,
  zoom: 8.61483,
  pitch: 50.45393,
  bearing: -33.98813
}

const MS_PER_DAY = 8.64e7

const TIME_GAP = 30 * 60000 // Time dimension basis of data in ms

const upperPercentile = 100 // Cells with value larger than the upperPercentile will be hidden
const lowerPercentile = 0 // Cells with value smaller than the lowerPercentile will be hidden

// Defind distribution of colour to be used for colouring H3 hexagon object
const colorPalette = [
  { lowerPercentile: 99.999, rgba: [255, 255, 255, 255] },
  { lowerPercentile: 99.99, rgba: [220, 232, 247, 255] },
  { lowerPercentile: 99.95, rgba: [201, 219, 244, 255] },
  { lowerPercentile: 99.8, rgba: [182, 204, 242, 255] },
  { lowerPercentile: 99.5, rgba: [162, 187, 240, 255] },
  { lowerPercentile: 99, rgba: [120, 146, 239, 255] },
  { lowerPercentile: 98, rgba: [97, 122, 239, 255] },
  { lowerPercentile: 96, rgba: [82, 105, 240, 255] },
  { lowerPercentile: 93, rgba: [76, 87, 219, 255] },
  { lowerPercentile: 88, rgba: [55, 94, 192, 255] },
  { lowerPercentile: 81, rgba: [55, 100, 169, 255] },
  { lowerPercentile: 72, rgba: [54, 100, 147, 255] },
  { lowerPercentile: 61, rgba: [52, 96, 125, 255] },
  { lowerPercentile: 48, rgba: [49, 89, 105, 255] },
  { lowerPercentile: 33, rgba: [45, 79, 87, 255] },
  { lowerPercentile: 0, rgba: [40, 66, 69, 255] },
]
const sortedcolorPalette = colorPalette.sort((a, b) => b.lowerPercentile - a.lowerPercentile)

const getLayerColor = (density, rank, datasetLength) => {
  switch(density) {
    case null:
    case 0:
      return [0, 0, 0, 0]
    default: {
      const densityPercentile = ((datasetLength - (rank - 1)) / datasetLength) * 100
      if (upperPercentile < densityPercentile || lowerPercentile > densityPercentile)
        return [0, 0, 0, 0]

      return sortedcolorPalette.find(color => densityPercentile >= color.lowerPercentile).rgba
    }
  }
}

// Getting upper and lower time range from provided data
const getTimeRange = data => {
  if (!data) return null

  return data.reduce((timeRange, curr) => {
    timeRange[0] = Math.min(timeRange[0], curr.timestamp)
    timeRange[1] = Math.max(timeRange[1], curr.timestamp + TIME_GAP)
    return timeRange
  }, [Infinity, -Infinity])
}

// Getting the data that filtered from provided time filter
const getFilteredData = (data, timeFilter) => {
  const timeFilterRange = [timeFilter - (TIME_GAP / 2), timeFilter + (TIME_GAP / 2)]
  return data.filter(i => i.timestamp >= timeFilterRange[0] && i.timestamp < timeFilterRange[1])
}

// Ranking the data by using the value of Magnitude
const getRankedDensity = data => {
  const rank = data.sort((a, b) => b.magnitude - a.magnitude).map((el, index) => ({...el, rank: index + 1}))
  const length = data.length
  return [rank, length]
}

const Map = ({ data = [] }) => {
  const [rankedDensity, datasetLength] = useMemo(() => getRankedDensity(data), [data])
  const timeRange = useMemo(() => getTimeRange(data), [data])
  const [timeFilter, setTimeFilter] = useState(timeRange[0])

  useEffect(() => {
    setTimeFilter(timeRange[0])
  }, [timeRange])
  
  const displayTimeFilter = new Date(timeFilter).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const layer = new H3HexagonLayer({
    id: 'h3',
    data: getFilteredData(rankedDensity, timeFilter),
    opacity: 0.6,
    pickable: true,
    wireframe: false,
    filled: true,
    extruded: true,

    getHexagon: d => geoToH3(d.latitude, d.longitude, 7),
    getFillColor: d => getLayerColor(d.magnitude, d.rank, datasetLength),
    getElevation: d => d.magnitude
  })

  return (
    <>
      <DeckGL
        layers={[layer]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
      >
        <StaticMap
          reuseMaps
          mapStyle='mapbox://styles/mapbox/dark-v10'
          mapboxAccessToken={MAPBOX_TOKEN}
          preventStyleDiffing={true}
        />
      </DeckGL>
      {timeFilter && timeFilter !== Infinity && (
        <>
          <RangeController 
            min={timeRange[0]}
            max={timeRange[1]}
            value={timeFilter}
            animationSpeed={MS_PER_DAY / 24 / 30} // configuration of animation's timeframe
            onChange={setTimeFilter}
          />
          <div className='details'>
            {displayTimeFilter}
          </div>
        </>
      )}
    </>
  )
}

export default Map