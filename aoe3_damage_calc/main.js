import { gameData, loadGameData, getUnit, getCiv, unitDisplayTags } from "./data.js"
import { gatherUnitTechs, groupUnitTechs } from "./techs.js"
import { calcUnitStats, getStat } from "./stats.js"
import { calcBreakpoints, reduceBreakpoints, calcLancaster } from "./combat.js"
import { renderStats, renderTags, renderCards, renderBreakpoints, renderLancaster } from "./render.js"
import { savePref, loadPref, renderCivOptions, updateUnitOptions, selectUnitByName, setupUnitInput,
  setupAuraInput, setAuraInput, capitalizeFirstLetter } from "./controls.js"

const sides = ["left", "right"]
const auraNames = ["hitpoints", "attack"]

// per side: civ, unit, techs (techs that affect the unit), activeCards (names of the techs switched on),
// auras ({hitpoints, attack} as fractions), stats and tags
const state = {}
sides.forEach(function(side){
  state[side] = {civ: null, unit: null, techs: [], activeCards: new Set(), auras: {hitpoints: 0, attack: 0}, stats: null, tags: []}
})

// fill each side's column from the panel template; element ids end in Left/Right
sides.forEach(function(side){
  let panel = document.getElementById("sidePanel").innerHTML
  document.querySelector('.side[data-side="' + side + '"]').innerHTML = panel
    .replaceAll("{Side}", capitalizeFirstLetter(side))
    .replaceAll("{side}", side)
})

function element(id, side){
  return document.getElementById(id + capitalizeFirstLetter(side))
}

function auraElements(side, aura){
  let name = "aura" + capitalizeFirstLetter(aura)
  return [element(name + "Input", side), element(name + "Value", side)]
}

function selectCiv(side, civ){
  let s = state[side]
  s.civ = civ
  // the unit is reselected if the new civ has it too, otherwise the side is emptied
  if (!updateUnitOptions(civ, element("selectUnitButton", side)) && s.unit){
    Object.assign(s, {unit: null, techs: [], activeCards: new Set(), stats: null, tags: []})
    document.querySelectorAll('.' + side + ':is(.cards, .stats, .tags), .breakpoints, .lancaster').forEach(d => d.replaceChildren())
  }
  updateLink()
}

// activeCards: names of the cards to start switched on; by default the ones already on, when the unit is unchanged
function selectUnit(side, unit, activeCards){
  let s = state[side]
  if (activeCards == undefined) { activeCards = unit == s.unit ? Array.from(s.activeCards) : [] }
  s.unit = unit
  s.tags = unitDisplayTags(unit)
  s.techs = gatherUnitTechs(unit)
  let techGroups = groupUnitTechs(s.techs, s.civ.techs)
  // only cards the civ shows can be on
  let shown = new Set(techGroups.flat().map(d => d.name))
  s.activeCards = new Set(activeCards.filter(name => shown.has(name)))
  renderCards(side, techGroups, name => s.activeCards.has(name), function(name, active){
    if (active) { s.activeCards.add(name) } else { s.activeCards.delete(name) }
    recalculate(side)
  })
  renderTags(side, s.tags)
  recalculate(side)
}

// Recomputes a side's stats from its active cards and auras, then the comparison tables
function recalculate(side){
  let s = state[side]
  if (s.unit){
    s.stats = calcUnitStats(s.unit, s.techs.filter(d => s.activeCards.has(d.name)), s.auras)
    renderStats(side, s.stats)
    updateCenter()
  }
  updateLink()
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

// The page's setup lives in the URL hash so it can be shared, e.g.
// #leftCiv=British&leftUnit=Musketeer&leftCards=RGRedcoats&leftAuras=10,0&rightCiv=...
// and is also saved so the next visit starts where this one left off
function updateLink(){
  let params = new URLSearchParams()
  sides.forEach(function(side){
    let s = state[side]
    if (s.civ) { params.set(side + "Civ", s.civ.name) }
    if (s.unit) { params.set(side + "Unit", s.unit.name) }
    if (s.activeCards.size) { params.set(side + "Cards", Array.from(s.activeCards).join(",")) }
    if (auraNames.some(aura => s.auras[aura])) {
      params.set(side + "Auras", auraNames.map(aura => Math.round(s.auras[aura] * 100)).join(","))
    }
  })
  let hash = params.toString()
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search)
  savePref("link", hash)
}

function restoreSide(side, params){
  let civ = getCiv(params.get(side + "Civ"))
  if (!civ) { return }
  element("selectCivButton", side).value = civ.name
  selectCiv(side, civ)
  let auras = (params.get(side + "Auras") || "").split(",")
  auraNames.forEach(function(aura, i){
    let fraction = (parseFloat(auras[i]) || 0) / 100
    state[side].auras[aura] = fraction
    setAuraInput(...auraElements(side, aura), fraction)
  })
  let unitName = params.get(side + "Unit")
  // selecting the unit switches every card off, so switch the saved ones back on after
  if (unitName && selectUnitByName(element("selectUnitButton", side), unitName)){
    let cards = (params.get(side + "Cards") || "").split(",").filter(d => d)
    if (cards.length) { selectUnit(side, getUnit(unitName), cards) }
  }
}

// Wires one side's civ select, unit search and aura sliders
function setupSide(side){
  element("selectCivButton", side).addEventListener("change", function() {
    selectCiv(side, getCiv(this.value))
  })

  setupUnitInput(element("selectUnitButton", side), name => selectUnit(side, getUnit(name)))

  auraNames.forEach(function(aura){
    setupAuraInput(...auraElements(side, aura), function(fraction){
      state[side].auras[aura] = fraction
      recalculate(side)
    })
  })
}

document.getElementById("copyLink").addEventListener("click", function(){
  let button = this
  navigator.clipboard.writeText(location.href).then(function(){
    button.textContent = "Link copied"
    setTimeout(() => button.textContent = "Copy link", 1500)
  })
})

// a link pasted into the address bar of an open page
window.addEventListener("hashchange", () => location.reload())

loadGameData().then(function(){
  renderCivOptions(gameData.civs)
  sides.forEach(setupSide)
  let params = new URLSearchParams(location.hash.slice(1) || loadPref("link") || "")
  sides.forEach(side => restoreSide(side, params))
})
