
import { attackLabelText, attackLabelNodes } from "./attacknames.js"

// Fills a cell with a string, or with an array of nodes
function setContent(cell, content){
  if (Array.isArray(content)) { cell.append(...content) } else { cell.textContent = content ?? '' }
}

// Replaces the contents of the table at selector.
// columns: [{head, cl, text, color, detail}] where cl, text and color are values or functions of (row, i);
// head and text may be arrays of nodes; detail columns are hidden in the simplified view
// options.headerRows: rows of header cells, each a string or {text, colspan, detail}; defaults to the column heads
// options.headerClass: class for every header cell
function renderTable(selector, columns, rows, options = {}){
  let headerRows = options.headerRows || [columns.map(c => ({text: c['head'], detail: c['detail']}))]
  let table = document.querySelector(selector)
  table.replaceChildren()

  let thead = table.createTHead()
  headerRows.forEach(function(headers){
    let tr = thead.insertRow()
    headers.forEach(function(header){
      let th = document.createElement('th')
      if (options.headerClass) { th.className = options.headerClass }
      if (typeof header == 'string'){
        th.textContent = header
      } else {
        setContent(th, header['text'])
        if (header['colspan']) { th.colSpan = header['colspan'] }
        if (header['detail']) { th.classList.add('detail') }
      }
      tr.append(th)
    })
  })

  let tbody = table.createTBody()
  rows.forEach(function(row, i){
    let tr = tbody.insertRow()
    columns.forEach(function(c){
      let cell = k => typeof c[k] == 'function' ? c[k](row, i) : c[k]
      let td = tr.insertCell()
      setContent(td, cell('text'))
      if (c['cl']) { td.className = cell('cl') }
      if (c['color']) { td.style.backgroundColor = cell('color') }
      if (c['detail']) { td.classList.add('detail') }
    })
  })
  return table
}

const formatNumber = d => Number(d).toFixed(2)
const formatPercent = d => Math.round(d * 100) + '%'

export function renderStats(side, rows){
  let columns = [
    { head: 'Statistic', cl: 'left-align', text: d => d['niceName'] },
    { head: 'Base', cl: 'right-align', text: d => d['baseValue'] },
    { head: '+%', cl: 'center', text: d => d['BasePercent'] == 0 ? '' : formatPercent(d['BasePercent']) },
    { head: '+abs', cl: 'center', text: d => d['Absolute'] == 0 ? '' : d['Absolute'] },
    { head: 'Aura', cl: 'center', text: d => d['aura'] == 0 ? '' : formatPercent(d['aura']) },
    { head: 'Modified', cl: 'right-align', text: d => formatNumber(d['modifiedValue']) },
  ]
  renderTable('.stats.'+side, columns, rows, {headerClass: 'title'})
}

export function renderTags(side, tags){
  let columns = [
    { head: 'tag', cl: 'title', text: d => d },
  ]
  renderTable('.tags.'+side, columns, tags)
}

// Draws one row of clickable cards per tech group.
// isActive(name) says whether a card starts switched on; onToggle(name, active) is called when one is clicked
export function renderCards(side, techGroups, isActive, onToggle){
  let gallery = document.querySelector('.cards.'+side)
  gallery.replaceChildren()
  techGroups.forEach(function(techs){
    let group = document.createElement('div')
    group.className = 'card_group'
    techs.forEach(function(tech){
      let card = document.createElement('div')
      card.className = 'card'
      card.dataset.name = tech.name
      card.classList.toggle('active', isActive(tech.name))
      card.addEventListener('click', function(){
        let active = !card.classList.contains('active')
        // a tech can be in more than one group
        gallery.querySelectorAll('.card').forEach(function(other){
          if (other.dataset.name == tech.name) { other.classList.toggle('active', active) }
        })
        onToggle(tech.name, active)
      })
      let img = document.createElement('img')
      img.alt = tech.displayName
      img.title = tech.description ? tech.displayName + "\n\n" + tech.description : tech.displayName
      img.src = tech.icon == null ? "" : tech.icon
      card.append(img)
      group.append(card)
    })
    gallery.append(group)
  })
}

export function renderBreakpoints(side, title, breakpoints){
  let columns = [
    { head: 'Attack Name', cl: 'title', text: d => attackLabelText(d, breakpoints), unit: ''},
    { head: 'Damage', detail: true, cl: 'right-align', text: d => formatNumber(d['damage']), unit: 'hp/atk'},
    { head: 'Multiplier', detail: true, cl: 'right-align', text: d => d['damagebonus'], unit: ''},
    { head: 'ROF', detail: true, cl: 'right-align', text: d => d['rof'], unit: 's/atk'},
    { head: 'Resists', detail: true, cl: 'right-align', text: d => formatNumber(d['resists']) , unit: ''},
    { head: 'Effective damage', detail: true, cl: 'right-align', text: d => formatNumber(d['effective_damage']), unit: 'hp'},
    { head: 'Hitpoints', detail: true, cl: 'right-align', text: d => formatNumber(d['hitpoints']),  unit: 'hp'},
    { head: 'Shots required', detail: true, cl: 'right-align', text: d => formatNumber(d['shots_required']),   unit: ''},
    { head: 'Full shots required', cl: 'right-align', text: d => formatNumber(d['full_shots_required']), unit: ''},
    { head: 'Seconds required', cl: 'right-align', text: d => formatNumber(d['seconds_required']), unit: 's' },
    { head: 'Normalised dps', cl: 'right-align', text: d => formatNumber(d['vs damage/sec / vs cost']), unit: 'vs/vs/s' },
  ]
  renderTable('.breakpoints.'+side, columns, breakpoints, {headerRows: [
    [{text: title, colspan: 100}],
    columns.map(c => ({text: c['head'], detail: c['detail']})),
    columns.map(c => ({text: c['unit'], detail: c['detail']})),
  ]})
}

// ColorBrewer RdBu, red to blue
const rdBu = ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"]

// t in [0, 1] (clamped) to a colour along rdBu
function interpolateRdBu(t){
  let x = Math.min(Math.max(t, 0), 1) * (rdBu.length - 1)
  let i = Math.min(Math.floor(x), rdBu.length - 2)
  let from = parseInt(rdBu[i].slice(1), 16), to = parseInt(rdBu[i + 1].slice(1), 16)
  let channel = shift => Math.round(((from >> shift) & 255) * (i + 1 - x) + ((to >> shift) & 255) * (x - i))
  return "rgb(" + channel(16) + "," + channel(8) + "," + channel(0) + ")"
}

// rows from calcLancaster, against the right side's breakpoint rows; blue where the left unit wins the trade,
// red where the right one does, on a log scale from 0.5 to 2. Attacks show their stances as icons
export function renderLancaster(rows, rightBreakpoints){
  let colorScale = d => interpolateRdBu(Math.log(d / 0.5) / Math.log(4))
  let leftBreakpoints = rows.map(d => d['attack'])
  let columns = [
    { head: 'Attack', cl: 'left-align attack', text: d => attackLabelNodes(d['attack'], leftBreakpoints) },
  ].concat(rightBreakpoints.map((attack, i) => (
    { head: attackLabelNodes(attack, rightBreakpoints), cl: 'left-align', text: d => formatNumber(d['ratios'][i]), color: d => colorScale(d['ratios'][i]) }
  )))
  renderTable('.lancaster', columns, rows, {headerClass: 'title'})
}

// The two units under the cross table, framed in the colour of the side that wins there
export function renderMatchup(leftUnit, rightUnit){
  let unitFigure = function(unit, side){
    let figure = document.createElement('figure')
    figure.className = 'matchup-unit ' + side
    // a few campaign units have no portrait
    if (unit.icon){
      let img = document.createElement('img')
      img.src = unit.icon
      img.alt = unit.displayName
      figure.append(img)
    }
    let caption = document.createElement('figcaption')
    caption.textContent = unit.displayName
    figure.append(caption)
    return figure
  }
  let vs = document.createElement('span')
  vs.className = 'vs'
  vs.textContent = 'vs'
  let units = document.createElement('div')
  units.className = 'matchup-units'
  units.append(unitFigure(leftUnit, 'left'), vs, unitFigure(rightUnit, 'right'))
  let note = document.createElement('p')
  note.className = 'matchup-note'
  note.innerHTML = '<span class="left">Blue</span> = left wins, <span class="right">red</span> = right wins'
  document.querySelector('.matchup').replaceChildren(units, note)
}
