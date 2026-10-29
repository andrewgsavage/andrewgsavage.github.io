"use strict"

// A side in a fight: {stats: rows from calcUnitStats, tags: unitDisplayTags}

// How long each of the attacker's attacks takes to kill the defender
function calcBreakpoints(attacker, defender){
  let defenderHp = getStat(defender.stats, 'maxhitpoints')
  let attackNames = new Set(attacker.stats.filter(d => d['attackName'] ).map(d => d['attackName']))
  hiddenAttackNames.forEach(d => attackNames.delete(d) )

  return Array.from(attackNames).map(function(attackName){
    let attackRows = attacker.stats.filter(d => d['attackName'] == attackName)
    let damageRow = attackRows.filter(d => d['tag'] == 'damage')[0]
    let attackDamage = damageRow['modifiedValue']
    let attackRof = attackRows.filter(d => d['tag'] == 'rof')[0]['modifiedValue']

    let damageBonus = attackRows.filter(d => defender.tags.includes(d['type']) && d['tag'] == 'damagebonus')
      .map(d => d['modifiedValue'])
      .reduce( (a, b) => a * b, 1)

    let damagetype = damageRow['damagetype']
    let defendArmor = defender.stats.filter(d => d['armortype'] == damagetype)[0]
    let defendResists = defendArmor['armortype'] == damagetype ? defendArmor['modifiedValue'] : 0.0

    let effectiveDamage = attackDamage * damageBonus * (1-defendResists)
    let record = {
      'attackName': attackName,
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
    if (attackName.includes("vils")){
      attackerCost = attackerCost * parseInt(attackName.slice(0,2))
    }
    // vs damage per vs cost
    record['vs damage/sec / vs cost'] = defenderCost / record['seconds_required'] / attackerCost
    return record
  })
}

// Merges attacks whose breakpoints are identical into one row named after all of them
function reduceBreakpoints(breakpoints){
  let reduced = JSON.parse(JSON.stringify(breakpoints))
  reduced.forEach(d => d['attackName'] = "")
  // remove dupes
  reduced = reduced.filter((v,i,a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i)

  reduced.forEach(function(reducedRow){
    breakpoints.forEach(function(originalRow){
      let count = 0
      for (const [key, value] of Object.entries(originalRow)) {
        if (value == reducedRow[key]){
          count = count + 1
        }
      }
      if (count == Object.keys(originalRow).length - 1){
        reducedRow['attackName'] = originalRow['attackName'] + " " + reducedRow['attackName']
      }
    })
  })
  if (!reduced[0]["attackName"].includes("vils")){
    reduced.sort((a, b) => a['seconds_required'] - b['seconds_required'])
  }
  return reduced
}

// Lanchester-style cost efficiency of every left attack against every right attack:
// above 1 the left unit wins the trade for its cost, below 1 the right one does
function calcLancaster(leftBreakpoints, rightBreakpoints, leftCost, rightCost){
  return leftBreakpoints.map(function(leftRow){
    let row = {lhs_attackName: leftRow['attackName']}
    rightBreakpoints.forEach(function(rightRow){
      let leftDeathRate = rightRow['seconds_required']
      let rightDeathRate = leftRow['seconds_required']
      row[rightRow['attackName']] = (leftDeathRate * rightCost) / (rightDeathRate * leftCost)
    })
    return row
  })
}
