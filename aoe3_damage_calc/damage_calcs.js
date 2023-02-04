
function getAttackNames(side){
  attacker_stat_table_data = unit_stats[side]
  attackNames = new Set(attacker_stat_table_data.filter(d => d['attackName'] ).map(d => d['attackName']))

  attacNamesToDelete.forEach(d => attackNames.delete(d) )

  attackNames = Array.from(attackNames)
  attackNames = attackNames.sort((a, b) => {
    if (a.includes('Building') ){
    return 1
    } else if (a.includes('BowAttack') || a.includes('Ranged')){
    return -1
    }
    })
  return attackNames
  }
  function calcBreakpoints(attacker_side, defender_side){
  
  attacker_stat_table_data = unit_stats[attacker_side]
  defender_stat_table_data = unit_stats[defender_side]
  defender_tags = unit_tags[defender_side].map( d => d['tag'])
  
  defender_hp = defender_stat_table_data.filter(d => d['gameName'] == 'maxhitpoints')[0]['modifiedValue']
  attackNames = getAttackNames(attacker_side)

  
	
  attackNames = new Set(attacker_stat_table_data.filter(d => d['attackName'] ).map(d => d['attackName']))
  attacNamesToDelete.forEach(d => attackNames.delete(d) )
  breakpoints_data = Array.from(attackNames).map(function(attackName){
    attack_stat_table_data = attacker_stat_table_data.filter(d => d['attackName'] ==  attackName)
    attack_damage = attack_stat_table_data.filter(d => d['tag'] ==  'damage')[0]['modifiedValue']
    attack_rof = attack_stat_table_data.filter(d => d['tag'] ==  'rof')[0]['modifiedValue']
  
    attack_damagebonus = attack_stat_table_data.filter(d => defender_tags.includes(d['type']) )
    attack_damagebonus = attack_damagebonus.filter(d => d['tag'] == 'damagebonus').map(d => d['modifiedValue'])
    attack_damagebonus = attack_damagebonus.reduce( (a, b) => a * b, 1)

    damagetype = attack_stat_table_data.filter(d => d['tag'] ==  'damage')[0]['damagetype']    
    defend_armor = defender_stat_table_data.filter(d => d['armortype']== damagetype)[0]
    if(defend_armor['armortype'] == damagetype){
      defend_resists = defend_armor['modifiedValue']
    } else{
      defend_resists = 0.0
    }
  
    effective_damage = attack_damage * attack_damagebonus * (1-defend_resists)
    record = {
      'attackName': attackName,
      'damage': attack_damage,
      'damagebonus': attack_damagebonus,
      'rof': attack_rof,
      'resists': defend_resists,
      'effective_damage': effective_damage,
      'hitpoints': defender_hp,
      'shots_required': defender_hp / effective_damage,
    }  

    record['full_shots_required'] = Math.ceil(record['shots_required'] )
    record['seconds_required'] = record['full_shots_required'] * attack_rof
	
	
	att_cost = attacker_stat_table_data.filter(d => d['gameName'] ==  'TotalCost')[0]['modifiedValue']
	def_cost = defender_stat_table_data.filter(d => d['gameName'] ==  'TotalCost')[0]['modifiedValue']
	if (record["attackName"].includes("vils")){
		att_cost = att_cost * parseInt(record['attackName'].slice(0,2))
	}
	// vs damage per vs cost
	record['vs damage/sec / vs cost'] = def_cost / record['seconds_required'] / att_cost
    return record
    })
  return breakpoints_data
  }
  function reduce_breakpoints_data(breakpoints_data){

        reduced_breakpoints_data = JSON.parse(JSON.stringify(breakpoints_data));
        reduced_breakpoints_data =  reduced_breakpoints_data.map(function(d){ 
        d['attackName'] = ""
        return d})
        // remove dupes
        reduced_breakpoints_data = reduced_breakpoints_data.filter((v,i,a)=>a.findIndex(t=>(JSON.stringify(t) === JSON.stringify(v)))===i)

reduced_breakpoints_data = reduced_breakpoints_data.map(function(reduced_row){


breakpoints_data.forEach(function(original_row){
count = 0;
    for (const [key, value] of Object.entries(original_row)) {
        if (value == reduced_row[key]){
        count = count + 1
    }
    }
 if (count == Object.keys(original_row).length -1 ){
 reduced_row['attackName'] = original_row['attackName'] + " " + reduced_row['attackName']
}

})

        return reduced_row
        })
		if (!reduced_breakpoints_data[0]["attackName"].includes("vils")){
			reduced_breakpoints_data.sort(function(a,b){return a['seconds_required']-b['seconds_required']})
		}
  return reduced_breakpoints_data
  }
  

  function updateBreakpoints(attacker_side, defender_side){
    breakpoints_data = calcBreakpoints(attacker_side, defender_side)
    breakpoints_data = reduce_breakpoints_data(breakpoints_data)
    let columns = [
      { head: 'Attack Name', cl: 'title', html: d => d['attackName'], unit: ''},
      { head: 'Damage', cl: 'right-align', html: d => d3.format(".2f")(d['damage']), unit: 'hp/atk'},
      { head: 'Multiplier', cl: 'right-align', html: d => d['damagebonus'], unit: ''},
      { head: 'ROF', cl: 'right-align', html: d => d['rof'], unit: 's/atk'},
      { head: 'Resists', cl: 'right-align', html: d => d3.format(".2f")(d['resists']) , unit: ''},
      { head: 'Effective damage', cl: 'right-align', html: d => d3.format(".2f")(d['effective_damage']), unit: 'hp'},
      { head: 'Hitpoints', cl: 'right-align', html: d => d3.format(".2f")(d['hitpoints']),  unit: 'hp'},
      { head: 'Shots required', cl: 'right-align', html: d => d3.format(".2f")(d['shots_required']),   unit: ''},
      { head: 'Full shots required', cl: 'right-align', html: d => d3.format(".2f")(d['full_shots_required']), unit: ''},
      { head: 'Seconds required', cl: 'right-align', html: d => d3.format(".2f")(d['seconds_required']), unit: 's' },
      { head: 'Normalised dps', cl: 'right-align', html: d => d3.format(".2f")(d['vs damage/sec / vs cost']), unit: 'vs/vs/s' },
    ]
    let table = d3.select('.breakpoints.'+attacker_side).html("")
  header = getUnitName(attacker_side) + " (" + attacker_side + 
    ") attacking " + getUnitName(defender_side) + " (" + defender_side +")"
  // create table header
  thead = table.append('thead')
  
  thead.append('tr')
        .selectAll('th')
        .data(["sdf"]).enter()
        .append('th')
        .text(header)
        .attr('colspan',100 );
  
  thead.append('tr')
    .selectAll('th')
    .data(columns).enter()
    .append('th')
    .text(d => d['head']);
  thead.append('tr')
    .selectAll('th')
    .data(columns).enter()
    .append('th')
    .text(d => d['unit']);
  
  // create table body
  table.append('tbody')
    .selectAll('tr')
    .data(breakpoints_data).enter()
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
    .text(d => d['head'])
    .html(d => d['html'])
    .attr('class', d => d['cl'])
    return breakpoints_data
  }
        
function lancaster(){
	start = 0.5
	end = 2
	
    // Log Scale
    const logScale = d3.scaleLog()
      .domain([start, end])
    const colorScaleLog = d3.scaleSequential(
        (d) => d3.interpolateRdBu(logScale(d))
      )   
colorScale = colorScaleLog

  lancater_data = []
  breakpoints_data_lhs.forEach(function(breakpoint_lhs ){
	dat = {lhs_attackName: breakpoint_lhs['attackName']}
	columns = [
	        { head: 'Attack', cl: 'left-align', html: d => d['lhs_attackName'] },
	]
	breakpoints_data_rhs.forEach(function(breakpoint_rhs ){
		left_deathrate = breakpoint_rhs['seconds_required']
		right_deathrate = breakpoint_lhs['seconds_required']
		left_cost = unit_stats['left'].filter(d => d['gameName'] ==  'TotalCost')[0]['modifiedValue']
		right_cost = unit_stats['right'].filter(d => d['gameName'] ==  'TotalCost')[0]['modifiedValue']
		dat[breakpoint_rhs['attackName']] =  (left_deathrate * right_cost) / (right_deathrate * left_cost) 
columns.push(
	        { head: breakpoint_rhs['attackName'], cl: 'left-align', html: d => d3.format(".2f")(d[breakpoint_rhs['attackName']]), color:d=> colorScale(d[breakpoint_rhs['attackName']]) },
)
		})
	lancater_data.push(dat)
	})




    // create table
    let table = d3.select('.lancaster').html("")
  
    // create table header
    table.append('thead').append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .attr('class', 'title')
        .text(d => d['head']);
  
    // create table body
    table.append('tbody')
        .selectAll('tr')
        .data(lancater_data).enter()
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
        .text(d => d['head'])
        .html(d => d['html'])
        .attr('class', d => d['cl'])
    .style('background-color', d => d['color'])

  }
  