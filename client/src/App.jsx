import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [challenge, setChallenge] = useState(null)
  const [reel, setReel] = useState([])
  const [poseTips, setPoseTips] = useState(null)
  const [generatedImage, setGeneratedImage] = useState('')
  const [caption, setCaption] = useState('Tuesday drop: trying this pose challenge')
  const [customPrompt, setCustomPrompt] = useState('editorial street portrait, soft film grain')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const userId = 'creator-882'

  const weeklyGoal = useMemo(() => {
    if (!challenge) {
      return 0
    }
    return Math.min(Math.round((challenge.stats.weeklyCheckins / 3) * 100), 100)
  }, [challenge])

  async function fetchChallenge() {
    const response = await fetch(`/api/challenge?userId=${encodeURIComponent(userId)}`)
    const data = await response.json()
    setChallenge(data)
    return data
  }

  async function fetchReel() {
    const response = await fetch(`/api/reel?userId=${encodeURIComponent(userId)}`)
    const data = await response.json()
    setReel(data.items)
  }

  async function fetchPoseTips(poseId) {
    const response = await fetch(`/api/pose-tips/${poseId}`)
    const data = await response.json()
    setPoseTips(data)
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true)
        const currentChallenge = await fetchChallenge()
        await Promise.all([fetchReel(), fetchPoseTips(currentChallenge.today.pose.id)])
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  async function handleGenerate() {
    if (!challenge) {
      return
    }

    try {
      setGenerating(true)
      setStatusMessage('')

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          poseId: challenge.today.pose.id,
          prompt: customPrompt,
        }),
      })

      const data = await response.json()
      setGeneratedImage(data.imageUrl)
      setStatusMessage('Image generated. Lock your daily check-in to protect streak.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCheckin() {
    if (!challenge || !generatedImage) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          poseId: challenge.today.pose.id,
          imageUrl: generatedImage,
          caption,
        }),
      })

      const data = await response.json()
      setStatusMessage(data.message)
      const updatedChallenge = await fetchChallenge()
      await Promise.all([fetchReel(), fetchPoseTips(updatedChallenge.today.pose.id)])
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdvanceDay() {
    await fetch('/api/demo/advance-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const updatedChallenge = await fetchChallenge()
    await Promise.all([fetchReel(), fetchPoseTips(updatedChallenge.today.pose.id)])
    setGeneratedImage('')
    setStatusMessage('Demo day advanced. New challenge is live.')
  }

  return (
    <main className="app-shell">
      <header className="top-hero">
        <div>
          <p className="eyebrow">PixelMuse Retention Prototype</p>
          <h1>Weekly Pose League</h1>
          <p className="subhead">
            Give creators a reason to return: a new challenge every day, streak progression,
            and a remix reel that updates with their style arc.
          </p>
        </div>
        <div className="metric-box">
          <p>Primary metric</p>
          <strong>Day-7 retention: 11% -&gt; 26%</strong>
          <span>Target segment: Gen Z creators posting 3-5 times/week.</span>
        </div>
      </header>

      {loading || !challenge ? (
        <section className="panel">Loading challenge loop...</section>
      ) : (
        <section className="grid-layout">
          <article className="panel challenge-panel">
            <div className="panel-top">
              <h2>{challenge.today.theme}</h2>
              <span>{challenge.today.dayLabel}</span>
            </div>

            <div className="progress-cluster">
              <div>
                <label>Streak</label>
                <p>{challenge.progression.streak} days</p>
              </div>
              <div>
                <label>Level</label>
                <p>{challenge.progression.level}</p>
              </div>
              <div>
                <label>Weekly goal</label>
                <p>{challenge.stats.weeklyCheckins}/3</p>
              </div>
            </div>

            <div className="progress-bar" aria-label="Weekly goal progress">
              <span style={{ width: `${weeklyGoal}%` }}></span>
            </div>

            <div className="pose-summary">
              <h3>Today&apos;s pose: {challenge.today.pose.title}</h3>
              <p>Difficulty: {challenge.today.pose.difficulty}</p>
              <p>{challenge.today.completedToday ? 'Check-in complete. Come back tomorrow.' : 'Generate and check-in to keep your streak alive.'}</p>
            </div>

            <button className="ghost-btn" onClick={handleAdvanceDay}>
              Demo: Jump to next day
            </button>
          </article>

          <article className="panel creation-panel">
            <h2>Pose Coach + Generator</h2>
            {poseTips && (
              <ul className="tips-list">
                {poseTips.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}

            <label htmlFor="prompt">Style prompt</label>
            <textarea
              id="prompt"
              rows="2"
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
            ></textarea>

            <label htmlFor="caption">Reel caption</label>
            <textarea
              id="caption"
              rows="2"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            ></textarea>

            <div className="button-row">
              <button className="primary-btn" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : 'Generate image'}
              </button>
              <button
                className="primary-btn alt"
                onClick={handleCheckin}
                disabled={!generatedImage || submitting}
              >
                {submitting ? 'Submitting...' : 'Lock daily check-in'}
              </button>
            </div>

            {generatedImage && (
              <div className="generated-wrap">
                <img src={generatedImage} alt="Generated output" />
              </div>
            )}

            {statusMessage && <p className="status-text">{statusMessage}</p>}
          </article>

          <article className="panel reel-panel">
            <div className="panel-top">
              <h2>Remix Reel</h2>
              <span>Updates every day</span>
            </div>

            <div className="reel-list">
              {reel.map((item) => (
                <div className="reel-card" key={item.id}>
                  <img src={item.imageUrl} alt={item.caption} />
                  <div className="reel-meta">
                    <strong>@{item.username}</strong>
                    <p>{item.caption}</p>
                    <small>{item.likes} likes · {item.theme}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

export default App
