'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import styles from './VideoPlayer.module.css'

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function formatTime(s: number) {
  if (isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showSpeed, setShowSpeed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasVideo, setHasVideo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const proxyUrl = (raw: string) =>
    `/api/stream?url=${encodeURIComponent(raw)}`

  const handleLoad = () => {
    if (!inputUrl.trim()) return
    setError('')
    setLoading(true)
    setHasVideo(false)
    setCurrentTime(0)
    setDuration(0)
    setBuffered(0)
    const proxied = proxyUrl(inputUrl.trim())
    setUrl(proxied)
  }

  const handleVideoLoaded = () => {
    setLoading(false)
    setHasVideo(true)
  }

  const handleVideoError = () => {
    setLoading(false)
    setError('Could not load video. Make sure the URL is a direct link to an mp4/webm file.')
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setIsPlaying(true) }
    else { v.pause(); setIsPlaying(false) }
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1))
    }
  }

  const handleDurationChange = () => {
    const v = videoRef.current
    if (v) setDuration(v.duration)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current
    const v = videoRef.current
    if (!bar || !v || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.currentTime = ratio * duration
  }

  const handleSpeedChange = (s: number) => {
    const v = videoRef.current
    if (v) v.playbackRate = s
    setSpeed(s)
    setShowSpeed(false)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) videoRef.current.volume = val
    setMuted(val === 0)
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 2500)
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) setShowControls(true)
  }, [isPlaying])

  const handleDownload = async () => {
    if (!inputUrl.trim()) return
    setDownloading(true)
    setDownloadProgress(0)
    try {
      const res = await fetch(proxyUrl(inputUrl.trim()))
      if (!res.ok) throw new Error('Failed')
      const total = parseInt(res.headers.get('content-length') || '0', 10)
      const reader = res.body!.getReader()
      const chunks: Uint8Array[] = []
      let received = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        if (total) setDownloadProgress(Math.round((received / total) * 100))
      }
      const blob = new Blob(chunks)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const ext = inputUrl.trim().split('?')[0].split('.').pop() || 'mp4'
      a.download = `video.${ext}`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      setError('Download failed.')
    } finally {
      setDownloading(false)
      setDownloadProgress(0)
    }
  }

  const progress = duration ? (currentTime / duration) * 100 : 0
  const bufferPct = duration ? (buffered / duration) * 100 : 0

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>▶</span>
          <span>Stream<b>Vault</b></span>
        </div>
        <p className={styles.tagline}>Progressive video streaming from any direct link</p>
      </header>

      {/* URL Input */}
      <div className={styles.inputSection}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>🔗</span>
            <input
              className={styles.input}
              type="url"
              placeholder="https://example.com/video.mp4"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
            />
          </div>
          <button className={styles.loadBtn} onClick={handleLoad} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Stream'}
          </button>
        </div>
        {error && <p className={styles.error}>⚠ {error}</p>}
      </div>

      {/* Player */}
      <div
        ref={containerRef}
        className={`${styles.playerContainer} ${hasVideo ? styles.active : ''} ${isFullscreen ? styles.fullscreen : ''}`}
        onMouseMove={handleMouseMove}
      >
        {!hasVideo && !loading && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>▶</div>
            <p>Paste a video URL above and hit <b>Stream</b></p>
            <p className={styles.placeholderSub}>Supports .mp4, .webm, .ogg and more</p>
          </div>
        )}

        {loading && (
          <div className={styles.placeholder}>
            <div className={styles.loadingRing} />
            <p>Connecting to stream...</p>
          </div>
        )}

        <video
          ref={videoRef}
          src={url || undefined}
          className={styles.video}
          onLoadedMetadata={handleVideoLoaded}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleVideoError}
          onClick={togglePlay}
          style={{ display: hasVideo ? 'block' : 'none' }}
          playsInline
        />

        {/* Controls overlay */}
        {hasVideo && (
          <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
            {/* Progress bar */}
            <div className={styles.progressArea}>
              <div className={styles.timeLabel}>{formatTime(currentTime)}</div>
              <div className={styles.progressBar} ref={progressRef} onClick={handleSeek}>
                <div className={styles.bufferFill} style={{ width: `${bufferPct}%` }} />
                <div className={styles.progressFill} style={{ width: `${progress}%` }}>
                  <div className={styles.progressThumb} />
                </div>
              </div>
              <div className={styles.timeLabel}>{formatTime(duration)}</div>
            </div>

            {/* Buttons */}
            <div className={styles.controlRow}>
              <div className={styles.leftControls}>
                <button className={styles.ctrlBtn} onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Volume */}
                <button className={styles.ctrlBtn} onClick={toggleMute} title="Mute">
                  {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  className={styles.volumeSlider}
                  type="range" min="0" max="1" step="0.02"
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                />
              </div>

              <div className={styles.rightControls}>
                {/* Speed */}
                <div className={styles.speedWrap}>
                  <button className={styles.ctrlBtn} onClick={() => setShowSpeed(p => !p)} title="Playback speed">
                    {speed}×
                  </button>
                  {showSpeed && (
                    <div className={styles.speedMenu}>
                      {SPEEDS.map(s => (
                        <button
                          key={s}
                          className={`${styles.speedOption} ${speed === s ? styles.speedActive : ''}`}
                          onClick={() => handleSpeedChange(s)}
                        >
                          {s}×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download */}
                <button className={styles.ctrlBtn} onClick={handleDownload} disabled={downloading} title="Download">
                  {downloading ? `${downloadProgress}%` : '⬇'}
                </button>

                {/* Fullscreen */}
                <button className={styles.ctrlBtn} onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? '⛶' : '⛶'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download progress bar */}
      {downloading && (
        <div className={styles.downloadBar}>
          <div className={styles.downloadFill} style={{ width: `${downloadProgress}%` }} />
          <span>Downloading... {downloadProgress}%</span>
        </div>
      )}

      <footer className={styles.footer}>
        <p>StreamVault streams videos progressively — playback starts before the full file downloads.</p>
      </footer>
    </div>
  )
}
