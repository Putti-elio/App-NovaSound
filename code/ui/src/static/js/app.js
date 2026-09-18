import 'htmx.org'
import '../css/app.css'
import albumsData from '../../mocks/albums.json'
import artistsData from '../../mocks/artists.json'
import playlistsData from '../../mocks/playlists.json'
import tracksData from '../../mocks/tracks.json'
import overviewData from '../../mocks/overview.json'

const pageSize = Number.POSITIVE_INFINITY
const rankings = {
  albums: albumsData,
  artists: artistsData,
  playlists: playlistsData,
  tracks: tracksData,
}

function initializeThemeToggle() {
  const toggle = document.querySelector('[data-theme-toggle]')
  const label = toggle?.querySelector('[data-theme-toggle-label]')

  if (!(toggle instanceof HTMLButtonElement) || !(label instanceof HTMLElement)) {
    return
  }

  const updateTheme = (theme) => {
    const isOled = theme === 'oled'
    document.documentElement.dataset.theme = isOled ? 'oled' : 'light'
    toggle.setAttribute('aria-pressed', String(isOled))
    toggle.setAttribute('aria-label', isOled ? 'Use light theme' : 'Use OLED dark theme')
    label.textContent = isOled ? 'Light theme' : 'OLED dark'
  }

  updateTheme(document.documentElement.dataset.theme)
  toggle.addEventListener('click', () => {
    updateTheme(document.documentElement.dataset.theme === 'oled' ? 'light' : 'oled')
  })
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName)

  if (className) {
    element.className = className
  }

  if (text) {
    element.textContent = text
  }

  return element
}

function createEntityCell(title, detail, link) {
  const cell = createElement('span', 'entity-cell')
  const content = link ? document.createElement('a') : document.createElement('span')

  if (link) {
    content.href = link
    content.target = '_blank'
    content.rel = 'noreferrer'
  }

  content.append(createElement('strong', '', title), createElement('small', '', detail))
  cell.append(content)

  return cell
}

function getRankingRow(category, item) {
  const row = document.createElement('li')
  row.append(createElement('span', 'rank', String(item.rank).padStart(2, '0')))

  if (category === 'artists') {
    row.append(
      createEntityCell(item.name, 'Billboard Top Artists 2025'),
       createElement('span', '', 'Annual ranking'),
      createElement('span', '', `#${item.rank}`),
      createElement('span', '', 'Billboard'),
    )
    return row
  }

  if (category === 'playlists') {
    row.append(
       createEntityCell(item.title, 'Public playlist', item.link),
      createElement('span', '', item.creator),
      createElement('span', '', String(item.trackCount)),
      createElement('span', '', 'Deezer'),
    )
    return row
  }

  if (category === 'albums') {
    row.append(
      createEntityCell(item.title, 'Album', item.link),
      createElement('span', '', item.artist),
      createElement('span', '', 'Album'),
      createElement('span', '', 'Deezer'),
    )
    return row
  }

  row.append(
     createEntityCell(item.title, 'Track', item.link),
    createElement('span', '', item.artist),
    createElement('span', '', item.album),
    createElement('span', '', 'Deezer'),
  )

  return row
}

function getColumnLabels(category) {
  if (category === 'artists') {
     return ['Rank', 'Artist', 'Ranking', 'Position', 'Source']
  }

  if (category === 'playlists') {
     return ['Rank', 'Playlist', 'Creator', 'Tracks', 'Source']
  }

  return category === 'albums'
     ? ['Rank', 'Album', 'Artist', 'Type', 'Source']
     : ['Rank', 'Track', 'Artist', 'Album', 'Source']
}

function renderRanking(rankingElement) {
  const category = rankingElement.dataset.ranking
  const ranking = rankings[category]
  const list = rankingElement.querySelector('[data-ranking-list]')
  const status = rankingElement.querySelector('[data-ranking-status]')
  const loadMoreButton = rankingElement.querySelector('[data-ranking-load-more]')

  if (!ranking || !list || !status || !loadMoreButton) {
    return
  }

  const heading = createElement('li', 'rank-table-head')
  for (const label of getColumnLabels(category)) {
    heading.append(createElement('span', '', label))
  }
  list.replaceChildren(heading)

  let displayed = 0
  const renderNextPage = () => {
    const nextItems = ranking.items.slice(displayed, displayed + pageSize)
    const rows = document.createDocumentFragment()

    for (const item of nextItems) {
      rows.append(getRankingRow(category, item))
    }

    list.append(rows)
    displayed += nextItems.length
     status.textContent = `${displayed} of ${ranking.items.length} results displayed`

    if (displayed === ranking.items.length) {
      loadMoreButton.remove()
      return
    }

    const nextEnd = Math.min(displayed + pageSize, ranking.items.length)
     loadMoreButton.textContent = `Load ranks ${displayed + 1} to ${nextEnd}`
  }

  loadMoreButton.addEventListener('click', renderNextPage)
  renderNextPage()
}

function hydrateOverview(target) {
  const overview = target.matches?.('[data-overview]')
    ? target
    : target.querySelector?.('[data-overview]')
  const updatedLabel = overview?.querySelector('[data-overview-updated]')

  if (updatedLabel) {
    updatedLabel.textContent = `${overviewData.provenance.source} · ${overviewData.updatedAt}`
  }
}

initializeThemeToggle()

document.body.addEventListener('htmx:afterSwap', (event) => {
  const target = event.detail.target
  const rankingElement = target.querySelector?.('[data-ranking]')

  if (rankingElement) {
    renderRanking(rankingElement)
  }

  hydrateOverview(target)
})
