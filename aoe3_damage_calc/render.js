"use strict"

// Replaces the contents of the table at selector.
// columns: [{head, cl, html, color}] where cl, html and color are values or functions of (row, i)
// options.headerRows: rows of header cells, each a string or {text, colspan}; defaults to the column heads
// options.headerClass: class for every header cell
function renderTable(selector, columns, rows, options){
  options = options || {}
  let headerRows = options.headerRows || [columns.map(c => c['head'])]
  let table = d3.select(selector).html("")

  let thead = table.append('thead')
  headerRows.forEach(function(headers){
    thead.append('tr')
      .selectAll('th')
      .data(headers).enter()
      .append('th')
      .attr('class', options.headerClass)
      .attr('colspan', d => d['colspan'])
      .text(d => typeof d == 'string' ? d : d['text'])
  })

  table.append('tbody')
    .selectAll('tr')
    .data(rows).enter()
    .append('tr')
    .selectAll('td')
    .data(function(row, i) {
      return columns.map(function(c) {
        // compute cell values for this specific row
        let cell = {};
        d3.keys(c).forEach(function(k) {
          cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k];
        });
        return cell;
      });
    }).enter()
    .append('td')
    .html(d => d['html'])
    .attr('class', d => d['cl'])
    .style('background-color', d => d['color'])
  return table
}

const formatNumber = d3.format(".2f")
const formatPercent = d3.format(".0%")

function renderStats(side, rows){
  let columns = [
    { head: 'Statistic', cl: 'left-align', html: d => d['niceName'] },
    { head: 'Base', cl: 'right-align', html: d => d['baseValue'] },
    { head: '+%', cl: 'center', html: d => d['BasePercent'] == 0 ? '' : formatPercent(d['BasePercent']) },
    { head: '+abs', cl: 'center', html: d => d['Absolute'] == 0 ? '' : d['Absolute'] },
    { head: 'Aura', cl: 'center', html: d => d['aura'] == 0 ? '' : formatPercent(d['aura']) },
    { head: 'Modified', cl: 'right-align', html: d => formatNumber(d['modifiedValue']) },
  ]
  renderTable('.stats.'+side, columns, rows, {headerClass: 'title'})
}

function renderTags(side, tags){
  let columns = [
    { head: 'tag', cl: 'title', html: d => d },
  ]
  renderTable('.tags.'+side, columns, tags)
}

// Draws one row of clickable cards per tech group; onToggle is called after a card is switched on or off
function renderCards(side, techGroups, onToggle){
  let gallery = d3.select('.cards.'+side).html("")
  techGroups.forEach(function(techs){
    gallery.append("div")
      .attr('class', 'card_group')
      .selectAll('.card')
      .data(techs).enter()
      .append('div')
      .attr('class', d => 'card '+side + (isAge0Tech(d) ? ' active' : ''))
      .on("click", function() {
        this.classList.toggle("active")
        onToggle()
      })
      .append('img')
      .attr("title", d => d.name)
      .attr('src', d => d.icon == null ? "" : iconRoot + d.icon)
  })
}

function activeCardNames(side){
  return Array.from(document.querySelectorAll('.card.active.'+side+' img')).map(d => d.title)
}

function renderBreakpoints(side, title, breakpoints){
  let columns = [
    { head: 'Attack Name', cl: 'title', html: d => d['attackName'], unit: ''},
    { head: 'Damage', cl: 'right-align', html: d => formatNumber(d['damage']), unit: 'hp/atk'},
    { head: 'Multiplier', cl: 'right-align', html: d => d['damagebonus'], unit: ''},
    { head: 'ROF', cl: 'right-align', html: d => d['rof'], unit: 's/atk'},
    { head: 'Resists', cl: 'right-align', html: d => formatNumber(d['resists']) , unit: ''},
    { head: 'Effective damage', cl: 'right-align', html: d => formatNumber(d['effective_damage']), unit: 'hp'},
    { head: 'Hitpoints', cl: 'right-align', html: d => formatNumber(d['hitpoints']),  unit: 'hp'},
    { head: 'Shots required', cl: 'right-align', html: d => formatNumber(d['shots_required']),   unit: ''},
    { head: 'Full shots required', cl: 'right-align', html: d => formatNumber(d['full_shots_required']), unit: ''},
    { head: 'Seconds required', cl: 'right-align', html: d => formatNumber(d['seconds_required']), unit: 's' },
    { head: 'Normalised dps', cl: 'right-align', html: d => formatNumber(d['vs damage/sec / vs cost']), unit: 'vs/vs/s' },
  ]
  renderTable('.breakpoints.'+side, columns, breakpoints, {headerRows: [
    [{text: title, colspan: 100}],
    columns.map(c => c['head']),
    columns.map(c => c['unit']),
  ]})
}

// rows from calcLancaster; red where the left unit wins the trade, blue where the right one does
function renderLancaster(rows, rightAttackNames){
  let logScale = d3.scaleLog().domain([0.5, 2])
  let colorScale = d3.scaleSequential(d => d3.interpolateRdBu(logScale(d)))
  let columns = [
    { head: 'Attack', cl: 'left-align', html: d => d['lhs_attackName'] },
  ].concat(rightAttackNames.map(name => (
    { head: name, cl: 'left-align', html: d => formatNumber(d[name]), color: d => colorScale(d[name]) }
  )))
  renderTable('.lancaster', columns, rows, {headerClass: 'title'})
}
