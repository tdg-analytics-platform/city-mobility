import React, { useEffect, useRef, useState } from 'react'
import Button from '@material-ui/core/IconButton'
import Slider from '@material-ui/core/Slider'
import PauseIcon from '@material-ui/icons/Pause'
import PlayIcon from '@material-ui/icons/PlayArrow'

const RangeController = ({ min, max, value, animationSpeed, onChange }) => {
  const frameRef = useRef()
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current)
  }, [frameRef])

  if (isPlaying) {
    const newTime = value + animationSpeed >= max
    ? min : value + animationSpeed
    
    frameRef.current = requestAnimationFrame(() => {
      onChange(newTime)
    })
  }

  return (
    <div id="controller">
      <Button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? <PauseIcon title="Stop" /> : <PlayIcon title="Animate" />}
      </Button>
      <Slider
        className="slider"
        step={3.6e+6}
        min={min}
        max={max}
        value={value}
        onChange={(_, val) => onChange(val)}
      />
    </div>
  )
}

export default RangeController