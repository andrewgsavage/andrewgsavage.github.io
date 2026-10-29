import { hiddenTags } from "./config.js"

// Game data written by tools/extract_data.py
export const gameData = {
  units: [],        // selectable units: {name, displayName, tags, stats, armor, costs, attacks}
  unitGroups: {},   // unit names offered to every civ, by group label
  techs: [],        // techs that affect a unit: {name, displayName, description, flags, icon, effects, statusTechs}
  civs: [],         // {name, techs, units}
}
const unitsByName = {}
const techsByName = {}

export function loadGameData(){
  let files = ["units", "techs", "civs"].map(name => fetch("data/" + name + ".json").then(r => r.json()))
  return Promise.all(files).then(function([units, techs, civs]){
    gameData.units = units.units
    gameData.unitGroups = units.groups
    gameData.techs = techs
    gameData.civs = civs
    gameData.units.forEach(u => { if (!(u.name in unitsByName)) { unitsByName[u.name] = u } })
    gameData.techs.forEach(t => { if (!(t.name in techsByName)) { techsByName[t.name] = t } })
  })
}

export function getUnit(name){
  return unitsByName[name]
}

export function getTech(name){
  return techsByName[name]
}

export function getCiv(name){
  return gameData.civs.find(d => d.name == name)
}

// unittypes plus the unit's own name, which is what tech effects target
export function unitTargetTags(unit){
  return unit.tags.concat([unit.name])
}

// tags shown in the tags table and matched by damage bonuses
export function unitDisplayTags(unit){
  let tags = unit.tags.filter(tag => !tag.includes("LogicalType") && !hiddenTags.includes(tag))
  return tags.concat([unit.name])
}
