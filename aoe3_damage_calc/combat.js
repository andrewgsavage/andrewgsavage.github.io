import { hiddenAttackNames } from "./config.js"
import { getStat } from "./stats.js"

// A side in a fight: {stats: rows from calcUnitStats, tags: unitDisplayTags}

// How long each of the attacker's attacks takes to kill the defender
export function calcBreakpoints(attacker, defender){
  let defenderHp = getStat(defender.stats, 'maxhitpoints')
  let attackNames = new Set(attacker.stats.filter(d => d['attackName'] ).map(d => d['attackName']))
  hiddenAttackNames.forEach(d => attackNames.delete(d) )

  let breakpoints = []
  attackNames.forEach(function(attackName){
    let attackRows = attacker.stats.filter(d => d['attackName'] == attackName)
    let damageRow = attackRows.find(d => d['tag'] == 'damage')
    let rofRow = attackRows.find(d => d['tag'] == 'rof')
    // some attacks (e.g. on Bosniaks and monks) only carry a damage bonus, so there's nothing to time
    if (!damageRow || !rofRow) { return }
    let attackDamage = damageRow['modifiedValue']
    let attackRof = rofRow['modifiedValue']

    let damageBonus = attackRows.filter(d => defender.tags.includes(d['type']) && d['tag'] == 'damagebonus')
      .map(d => d['modifiedValue'])
      .reduce( (a, b) => a * b, 1)

    // attacks without a damage type (a few campaign units) ignore armor
    let defendArmor = defender.stats.find(d => d['armortype'] == damageRow['damagetype'])
    let defendResists = defendArmor ? defendArmor['modifiedValue'] : 0.0

    let effectiveDamage = attackDamage * damageBonus * (1-defendResists)
    let record = {
      'attackName': attackName,
      'garrison': damageRow['garrison'] || 0,
      'damage': attackDamage,
      'damagebonus': damageBonus,
      'rof': attackRof,
      'resists': defendResists,
      'effective_damage': effectiveDamage,
      'hitpoints': defenderHp,
      'shots_required': defenderHp / effectiveDamage,
    }
    record['full_shots_required'] = Math.ceil(record['shots_required'] )
    record['seconds_required'] = record['full_shots_required'] * attackRof

    let attackerCost = getStat(attacker.stats, 'TotalCost')
    let defenderCost = getStat(defender.stats, 'TotalCost')
    // a garrisoned town center also costs its villagers
    if (record['garrison']){
      attackerCost = attackerCost * record['garrison']
    }
    // vs damage per vs cost
    record['vs damage/sec / vs cost'] = defenderCost / record['seconds_required'] / attackerCost
    breakpoints.push(record)
  })
  return breakpoints
}

// Merges attacks whose breakpoints are identical into one row named after all of them
export function reduceBreakpoints(breakpoints){
  let rowsByValues = new Map()
  breakpoints.forEach(function(row){
    let {attackName, ...values} = row
    let key = JSON.stringify(values)
    if (rowsByValues.has(key)){
      rowsByValues.get(key)['attackName'] += ", " + attackName
    } else {
      rowsByValues.set(key, Object.assign({attackName: attackName}, values))
    }
  })
  let reduced = Array.from(rowsByValues.values())
  // a garrisoned town center's rows stay in villager order
  if (!reduced.some(d => d['garrison'])){
    reduced.sort((a, b) => a['seconds_required'] - b['seconds_required'])
  }
  return reduced
}

// Lanchester-style cost efficiency of every left attack against every right attack:
// above 1 the left unit wins the trade for its cost, below 1 the right one does.
// Returns one row per left attack: {attackName, ratios} with ratios in rightBreakpoints order
export function calcLancaster(leftBreakpoints, rightBreakpoints, leftCost, rightCost){
  return leftBreakpoints.map(function(leftRow){
    let ratios = rightBreakpoints.map(function(rightRow){
      let leftDeathRate = rightRow['seconds_required']
      let rightDeathRate = leftRow['seconds_required']
      return (leftDeathRate * rightCost) / (rightDeathRate * leftCost)
    })
    return {attackName: leftRow['attackName'], ratios: ratios}
  })
}
