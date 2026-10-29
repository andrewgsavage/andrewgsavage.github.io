"use strict"

const sides = ["left", "right"]
// per side: civ, unit, techs (techs that affect the unit), stats and tags
const state = {left: {}, right: {}}

// fill each side's column from the panel template; element ids end in Left/Right
sides.forEach(function(side){
  let panel = document.getElementById("sidePanel").innerHTML
  document.querySelector('.side[data-side="' + side + '"]').innerHTML = panel
    .replaceAll("{Side}", capitalizeFirstLetter(side))
    .replaceAll("{side}", side)
})

function selectCiv(side, civ){
  state[side].civ = civ
  updateUnitOptions(civ, "#selectUnitButton" + capitalizeFirstLetter(side))
}

function selectUnit(side, unit){
  let s = state[side]
  s.unit = unit
  s.tags = unitDisplayTags(unit)
  s.techs = gatherUnitTechs(unit)
  renderCards(side, groupUnitTechs(s.techs, s.civ.techs), () => recalculate(side))
  renderTags(side, s.tags)
  recalculate(side)
}

// Recomputes a side's stats from its active cards and auras, then the comparison tables
function recalculate(side){
  let s = state[side]
  let active = activeCardNames(side)
  s.stats = calcUnitStats(s.unit, s.techs.filter(d => active.includes(d.name)), readAuras(side))
  renderStats(side, s.stats)
  updateCenter()
}

function updateCenter(){
  let left = state.left, right = state.right
  // nothing to compare until both sides have a unit
  if (!left.stats || !right.stats) { return }
  let leftBreakpoints = reduceBreakpoints(calcBreakpoints(left, right))
  let rightBreakpoints = reduceBreakpoints(calcBreakpoints(right, left))
  renderBreakpoints('left', left.unit.name + " (left) attacking " + right.unit.name + " (right)", leftBreakpoints)
  renderBreakpoints('right', right.unit.name + " (right) attacking " + left.unit.name + " (left)", rightBreakpoints)
  let lancaster = calcLancaster(leftBreakpoints, rightBreakpoints, getStat(left.stats, 'TotalCost'), getStat(right.stats, 'TotalCost'))
  renderLancaster(lancaster, rightBreakpoints.map(d => d['attackName']))
}

// Wires one side's civ select, unit search and aura sliders
function setupSide(side){
  let Side = capitalizeFirstLetter(side)

  d3.select("#selectCivButton" + Side).on("change", function() {
    let civ = getCiv(this.value)
    savePref("selectCivButton" + Side, civ['name'])
    selectCiv(side, civ)
  })

  setupUnitInput("#selectUnitButton" + Side, name => selectUnit(side, getUnit(name)))

  let auraInputIds = ["#auraHitpointsInput" + Side, "#auraAttackInput" + Side]
  auraInputIds.forEach(function(id_){
    d3.select(id_).on("change", () => recalculate(side))
  })
}

loadGameData().then(function(){
  renderCivOptions(gameData.civs)
  sides.forEach(setupSide)
  // restore each side's last civ and unit
  sides.forEach(function(side){
    let Side = capitalizeFirstLetter(side)
    let civName = loadPref("selectCivButton" + Side)
    if (!civName || !getCiv(civName)) { return }
    let civButton = document.getElementById("selectCivButton" + Side)
    civButton.value = civName
    civButton.dispatchEvent(new Event("change"))
    let unitName = loadPref("selectUnitButton" + Side)
    if (unitName) { selectUnitByName("#selectUnitButton" + Side, unitName) }
  })
})
