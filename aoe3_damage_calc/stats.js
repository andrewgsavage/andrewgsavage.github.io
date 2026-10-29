import { textStats, armorTypes, costTypes, gatherRates } from "./config.js"
import { getTech, unitTargetTags } from "./data.js"

// A unit's stats are a list of rows, one per stat:
// {niceName, baseValue, BasePercent, Absolute, aura, modifiedValue} plus fields saying what the row is:
// gameName for unit stats/armor/costs; attackName/action/damagetype/tag/type for attack values.
// action is the game's action name that tech effects target; attackName is the row's attack in the
// damage tables, which differs only for a town center's garrisoned attacks (garrison = villager count)

function calcModifier(record, effect, relativity){
  if (effect.unittype != undefined){
    if(effect.unittype != record['type'] ){
      return record
    }
  }
  if (relativity == 'BasePercent'){
    record['BasePercent'] = record['BasePercent'] + parseFloat(effect.amount) - 1.0
  }
  if (relativity == 'Absolute'){
    record['Absolute'] = record['Absolute'] + parseFloat(effect.amount)
  }
  return record
}

function applyEffect(effect, rows){
  // effects without a subtype don't change stats
  if (effect.subtype == undefined){ return rows }
  return rows.map(function(record){
    let isArmor = record['gameName'] != undefined && record['gameName'].includes("armor")
    if(effect.subtype==record['subtype']){
      record = calcModifier(record, effect, effect.relativity)
    }
    if(effect.subtype=="HitPoints" && record['subtype'] == "Hitpoints"){
      record = calcModifier(record, effect, effect.relativity)
    }
    if(effect.subtype=="Armor" && isArmor){
      record = calcModifier(record, effect, effect.relativity)
    }
    if(effect.subtype=="ArmorSpecific" && record['gameName'] != undefined && record['gameName'].includes(effect.newtype)){
      record = calcModifier(record, effect, effect.relativity)
    }
    // ArmorType moves the unit's armor over to the new armor type
    if(effect.subtype=="ArmorType" && record['baseValue'] != 0.0 && isArmor){
      record = calcModifier(record, {amount: '0.0'}, 'BasePercent')
    }
    if(effect.subtype=="ArmorType" && record['gameName'] != undefined && record['gameName'].includes(effect.newtype)){
      let oldArmor = rows.find(d => d['baseValue'] != 0.0 && d['gameName'] != undefined && d['gameName'].includes("armor"))
      record = calcModifier(record, {amount: oldArmor ? oldArmor['baseValue'] : 0}, 'Absolute')
    }
    if(effect.action != undefined){
      // record['tag'] = damagebonus, record['type'] = Building
      if(effect.subtype.toLowerCase() == record['tag'] && record['action'] == effect.action){
        record = calcModifier(record, effect, effect.relativity)
      }
    }
    if(effect.subtype=='DamageForAllHandLogicActions' && record['damagetype'] == "Hand" && record['tag'] == "damage"){
      record = calcModifier(record, effect, effect.relativity)
    }
    if(effect.allactions != undefined){
      if(effect.subtype =='DamageBonus' && effect.allactions=='1' && record['tag'] == "damagebonus" ){
        record = calcModifier(record, effect, effect.relativity)
      }
      if(effect.subtype=='Damage' && effect.allactions=='1' && record['tag'] == "damage"){
        record = calcModifier(record, effect, effect.relativity)
      }
    }
    return record
  })
}

function calcUnmodifiedUnitStats(unit){
  let rows = textStats.map(d => Object.assign({}, d, {
    baseValue: unit.stats[d.gameName] || 0,
    BasePercent: 0.0,
    Absolute: 0.0,
    tag: "",
    type: "",
  }))

  armorTypes.forEach(function(armor){
    rows.push({
      gameName: 'armor' + armor,
      niceName: 'Resists ' + armor,
      baseValue: 0.0,
      armortype: armor,
      BasePercent: 0.0,
      Absolute: 0.0,
    })
  })
  unit.armor.forEach(function([type, value]){
    rows.forEach(function(item){
      if(item.armortype == type){
        item.baseValue = value
      }
    })
  })

  costTypes.forEach(function(cost){
    rows.push({
      gameName: 'cost' + cost,
      niceName: 'Cost ' + cost,
      baseValue: 0.0,
      costtype: cost,
      BasePercent: 0.0,
      Absolute: 0.0,
    })
  })
  rows.push({
    gameName: 'TotalCost',
    niceName: 'Total cost (VS)',
    baseValue: 0.0,
    BasePercent: 0.0,
    Absolute: 0.0,
  })
  unit.costs.forEach(function([resourcetype, value]){
    rows.forEach(function(item){
      if(item.costtype == resourcetype){
        item.baseValue = value
      }
      if(item.gameName == 'TotalCost' && resourcetype in gatherRates){
        item.baseValue = item.baseValue + value / gatherRates[resourcetype]
      }
    })
  })
  rows.forEach(function(item){
    if(item.gameName == 'TotalCost'){
      item.baseValue = Math.round(item.baseValue * 10) / 10
    }
    if (item.gameName == 'TotalCost' && unit.name == "TownCenter"){
      item.baseValue = 1
    }
  })

  unit.attacks.forEach(function(attack){
    let attackLabel = attack.name + " (" + attack.damagetype + ") "
    attack.values.forEach(function([tag, value, type]){
      let record = {
        niceName: attackLabel + tag,
        baseValue: value,
        BasePercent: 0.0,
        Absolute: 0.0,
        damagetype: attack.damagetype,
        tag: tag,
        attackName: attack.name,
        action: attack.name,
      }
      if(type != undefined){
        record['niceName'] = record['niceName'] + " " + type
        record['type'] = type
      }
      rows.push(record)
      if (attack.name == "BuildingAttack" && attack.damagetype == "Siege" && tag == "damage" && type == undefined){
        rows.push({
          Absolute: 0,
          BasePercent: 0,
          baseValue: 1,
          damagetype: "Siege",
          niceName: "BuildingAttack (Siege) damagebonus Building",
          tag: "damagebonus",
          type: "Building",
          attackName: attack.name,
          action: attack.name,
        })
      }
    })
  })
  return rows
}

function applyTech(tech, rows, tags){
  // each effect applies once for every target that matches the unit
  tech.effects.forEach(function(effect){
    effect.targets.forEach(function(target){
      if(tags.includes(target)){
        rows = applyEffect(effect, rows)
      }
    })
  })
  // techs this one turns on, which tools/extract_data.py only lists for guard upgrades
  tech.statusTechs.forEach(function(name){
    let statusTech = getTech(name)
    if (statusTech) { rows = applyTech(statusTech, rows, tags) }
  })
  return rows
}

// A town center is also shown shooting with 1 to 10 villagers garrisoned, each adding 9 ranged damage
function addGarrisonedVillagerAttacks(rows){
  let newRows = rows.filter(d => d["gameName"])
  for (let nVils = 1; nVils <= 10; nVils++) {
    let attackRows = rows.filter(d => d["action"]=="RangedAttack" && d["tag"]!="damage").map(d => Object.assign({}, d))
    attackRows.push({
      "niceName": "RangedAttack (Ranged) damage",
      "baseValue": 9 * nVils,
      "BasePercent": 0,
      "Absolute": 0,
      "damagetype": "Ranged",
      "tag": "damage",
      "action": "RangedAttack",
    })
    attackRows.forEach(function(d){
      d["attackName"] = nVils + " vils RangedAttack"
      d["niceName"] = nVils + " vils " + d["niceName"]
      d["garrison"] = nVils
    })
    newRows = newRows.concat(attackRows)
  }
  return newRows
}

// auras: {hitpoints, attack} as fractions
export function calcUnitStats(unit, techs, auras){
  let rows = calcUnmodifiedUnitStats(unit)
  if (unit.name == "TownCenter"){
    rows = addGarrisonedVillagerAttacks(rows)
  }
  let tags = unitTargetTags(unit)
  techs.forEach(function(tech){
    rows = applyTech(tech, rows, tags)
  })
  rows.forEach(function(d){
    d['aura'] = 0.0
    if (d['gameName'] == 'maxhitpoints'){
      d['aura'] = auras.hitpoints
    }
    if (d['tag'] == "damage"){
      d['aura'] = auras.attack
    }
    d['modifiedValue'] = (d['baseValue'] * (1.0 + d['BasePercent']) + d['Absolute'] ) * (1.0 + d['aura'])
  })
  return rows
}

// a stat's modified value, or 0 if the unit doesn't have it
export function getStat(rows, gameName){
  let row = rows.find(d => d['gameName'] == gameName)
  return row ? row['modifiedValue'] : 0
}
