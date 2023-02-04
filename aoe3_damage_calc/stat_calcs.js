
  let text_stats =[
    {gameName:'populationcount', niceName: 'Population'},
    {gameName:'maxvelocity', niceName: 'Speed', subtype: 'MaximumVelocity'},
    {gameName:'maxrunvelocity', niceName: 'Max Speed'},
    {gameName:'turnrate', niceName: 'Turn Rate'},
    {gameName:'maxhitpoints', niceName: 'Hitpoints', subtype: 'Hitpoints'},
    {gameName:'los', niceName: 'Line of Sight', subtype: 'LOS'},
    {gameName:'trainpoints', niceName: 'Train Points', subtype: 'TrainPoints'},
    {gameName:'bounty', niceName: 'XP Bounty'},
  
  ];
  
  function calcModifier(record, effect, relativity){
    if (effect.attributes['unittype'] != undefined){
      if(effect.attributes['unittype'].value != record['type'] ){
      return record
      }
    }
    if (relativity == 'BasePercent'){
      record['BasePercent'] = record['BasePercent'] + parseFloat(effect.attributes['amount'].value) - 1.0
    }
    if (relativity == 'Absolute'){
      record['Absolute'] = record['Absolute'] + parseFloat(effect.attributes['amount'].value)
    }
    return record
  };
  
  function applyEffect(effect, stat_table_data, tech){
    stat_table_data = stat_table_data.map(function(record){
    if(effect.attributes['subtype'].value==record['subtype']){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['subtype'].value=="HitPoints" && record['subtype'] == "Hitpoints"){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['subtype'].value=="Armor" && record['gameName'] != undefined && record['gameName'].includes("armor" )){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['subtype'].value=="ArmorSpecific" && record['gameName'] != undefined && record['gameName'].includes(effect.attributes['newtype'].value)){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['subtype'].value=="ArmorType" && record['baseValue'] != 0.0 && record['gameName'] != undefined && record['gameName'].includes("armor" )){
	effect_ = { 
				attributes : {amount : { value :'0.0'}}
	}
          record = calcModifier(record, effect_, 'BasePercent')
		  
    }
    if(effect.attributes['subtype'].value=="ArmorType"&& record['gameName'] != undefined && record['gameName'].includes(effect.attributes['newtype'].value)){
		value = stat_table_data.filter(function(record_){return  record_['baseValue'] != 0.0 && record_['gameName'] != undefined && record_['gameName'].includes("armor" )
		})[0]['baseValue']
	effect_ = { 
				attributes : {amount : { value :value}}
	}
          record = calcModifier(record, effect_, 'Absolute')
		  
    }
    if(effect.attributes['action'] != undefined){
      // record['tag'] = damagebonus, record['type'] = Building, 
      if(effect.attributes['subtype'].value.toLowerCase() == record['tag'] && record['niceName'].includes(effect.attributes['action'].value ) ){
        record = calcModifier(record, effect, effect.attributes['relativity'].value)
      }
    }
    if(effect.attributes['subtype'].value=='DamageForAllHandLogicActions' && record['damagetype'] == "Hand" &&  record['tag'] == "damage"){
          record = calcModifier(record, effect, effect.attributes['relativity'].value)
    }
    if(effect.attributes['allactions'] != undefined){
      if(effect.attributes['subtype'].value =='DamageBonus' && effect.attributes['allactions'].value=='1' &&  record['tag'] == "damagebonus" ){
            record = calcModifier(record, effect, effect.attributes['relativity'].value)
      }
      if(effect.attributes['subtype'].value=='Damage' && effect.attributes['allactions'].value=='1' &&  record['tag'] == "damage"){
            record = calcModifier(record, effect, effect.attributes['relativity'].value)
      }
    }
    return record
    })
    return stat_table_data
  }
  function getBaseValue(text_stat, unit){
	  values = unit.getElementsByTagName(text_stat['gameName'])
	  if (values.length == 0){
		  return 0
	  }
	  return parseFloat(values[0].textContent)
  }
  
  function calcUnmodifiedUnitStats(unit){
    stat_table_data = [];
    stat_table_data = text_stats.map(function(d){
      d['baseValue'] = getBaseValue(d, unit)
      d['BasePercent'] = 0.0
      d['Absolute'] = 0.0
      d['tag'] = ""
      d['type'] = ""
      return d
    })
  
    tags = Array.from(unit.getElementsByTagName("unittype")).map(d => d.textContent)
    tags.push(unit.attributes['name'].value)
    
    armors = ["Hand", "Ranged", "Siege"]
    armors.forEach(function(armor){
    stat_table_data.push({
      gameName: 'armor' + armor,
      niceName: 'Resists ' + armor,
      baseValue: 0.0,
      armortype: armor,
      BasePercent: 0.0,
      Absolute: 0.0,
    })
    })
    
    armors = Array.from(unit.getElementsByTagName("armor"))
    armors.forEach(function(armor){
        stat_table_data.map(function(item){
            if(item.armortype == armor.getAttribute("type") ){
                item.baseValue = parseFloat(armor.getAttribute("value"))
                }
                return item
               
    })
    })
    
    costs = ["Food", "Wood", "Gold"]
    costs.forEach(function(cost){
    stat_table_data.push({
      gameName: 'cost' + cost,
      niceName: 'Cost ' + cost,
      baseValue: 0.0,
      costtype: cost,
      BasePercent: 0.0,
      Absolute: 0.0,
    })
    })
    
    
    stat_table_data.push({
      gameName: 'TotalCost',
      niceName: 'Total cost (VS)',
      baseValue: 0.0,
      BasePercent: 0.0,
      Absolute: 0.0,
    })
    
    costs = Array.from(unit.getElementsByTagName("cost"))
    costs.forEach(function(cost){
        stat_table_data.map(function(item){
            if(item.costtype == cost.getAttribute("resourcetype") ){
                item.baseValue = parseFloat(cost.textContent)
                }
                
            if(item.gameName == 'TotalCost'){
                
                if(cost.getAttribute("resourcetype")=='Food'){
                    item.baseValue = item.baseValue + parseFloat(cost.textContent)/0.84
                    }
                if(cost.getAttribute("resourcetype")=='Wood'){
                    item.baseValue = item.baseValue + parseFloat(cost.textContent)/0.5
                    }
                if(cost.getAttribute("resourcetype")=='Gold'){
                    item.baseValue = item.baseValue + parseFloat(cost.textContent)/0.6
                    }
            }
                return item
               
    })
    })
    
    stat_table_data.map(function(item){
        if(item.gameName == 'TotalCost'){
            item.baseValue = Math.round(item.baseValue * 10) / 10
        }
		if (item.gameName == 'TotalCost' && unit.attributes['name'].value == "TownCenter"){
			item.baseValue = 1 
		}
			
        return item
        })
    // cost = Array.from(unit.getElementsByTagName("Cost")).map(d => d.textContent + " " + d.attributes['resourcetype'].value )
    // stat_table_data.push({
    //   gameName:'Cost', niceName: 'Cost', baseValue: cost.join(", ")
    // })
  
    protoaction_tags = ['damage', 'maxrange', 'rof', 'damagecap', 'damagearea', 'damagebonus']
    protoactions = unit.getElementsByTagName("protoaction")
    Array.from(protoactions).filter(d => d.children[0].textContent.includes("Attack")).forEach(function(protoAction){
      record = {}
      attackname = protoAction.getElementsByTagName('name')[0].textContent
      myname = protoAction.getElementsByTagName('name')[0].textContent + " (" + protoAction.getElementsByTagName('damagetype')[0].textContent + ") "
  
      Array.from(protoAction.children).filter(d => protoaction_tags.includes(d.tagName)).forEach(function(item){
        record = {
          niceName: myname + item.tagName,
          baseValue: parseFloat(item.textContent),
          BasePercent: 0.0,
          Absolute: 0.0,
          damagetype: protoAction.getElementsByTagName('damagetype')[0].textContent,
          tag: item.tagName,
          attackName: protoAction.getElementsByTagName('name')[0].textContent,
        }
        if("type" in item.attributes){
          record['niceName'] = record['niceName'] + " " + item.attributes['type'].value
          record['type'] = item.attributes['type'].value
        }
      stat_table_data.push(record)
      if (record['niceName'] == "BuildingAttack (Siege) damage"){
        stat_table_data.push({
          Absolute: 0,
          BasePercent: 0,
          baseValue: 1,
          damagetype: "Siege",
          niceName: "BuildingAttack (Siege) damagebonus Building",
          tag: "damagebonus",
          type: "Building"
          })
      }})
    })
    return stat_table_data
  }
  function applyTech(tech, stat_table_data){
    // for each effect, 
    // for each target,
    // for each tag
    // check if applicable
    effects = Array.from(tech.getElementsByTagName("effects")[0].children).forEach(function(effect){
      targets = Array.from(effect.getElementsByTagName("target")).forEach(function(target){
        if(tags.includes(target.textContent)){
          stat_table_data = applyEffect(effect, stat_table_data, tech)
        }
      });
    })    
    if(tech.getAttribute("name").includes("RG")){
      rg_techs = Array.from(tech.getElementsByTagName("effect")).filter(effect => effect.getAttribute("type") == "TechStatus")
      rg_techs.forEach(function(tech){
        tech = Array.from(techtree.children).filter(d => d.attributes["name"].value == tech.textContent)[0]
        stat_table_data = applyTech(tech, stat_table_data)
      })
    };
    return stat_table_data
  }
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

  function calcUnitStats(unit, techs, side){
    stat_table_data = calcUnmodifiedUnitStats(unit)
	
	
	if (unit.attributes['name'].value == "TownCenter"){		
		new_stat_table_data = stat_table_data.filter(function(d){return d["gameName"]})

		for (var n_vils = 1; n_vils <= 10; n_vils++) {
			new_data = stat_table_data.filter(function(d){return d["attackName"]=="RangedAttack" && d["tag"]!="damage"})
						new_data = JSON.parse(JSON.stringify(new_data));

			new_data.push({
				"niceName": "RangedAttack (Ranged) damage",
				"baseValue": 9 * n_vils,
				"BasePercent": 0,
				"Absolute": 0,
				"damagetype": "Ranged",
				"tag": "damage",
				"attackName": "RangedAttack",
				"aura": 0,
				"modifiedValue": 9 * n_vils
			})
			new_data.map(function(d){
			d["attackName"] = n_vils + " vils RangedAttack"
			d["niceName"] = n_vils + " vils " + d["niceName"]
				return d
			});
			new_stat_table_data = new_stat_table_data.concat(new_data) 
		}
		stat_table_data = new_stat_table_data 
		}
	
	
    techs.forEach(function(tech){
      stat_table_data = applyTech(tech, stat_table_data)
    })
	
    stat_table_data = stat_table_data.map(function(d){
		d['aura'] = 0.0
	if (d['gameName'] == 'maxhitpoints'){
		d['aura'] = parseFloat(d3.select("#auraHitpointsInput"+capitalizeFirstLetter(side)).property("value"))/100
	}
	if (d['tag'] == "damage"){
		d['aura'] = parseFloat(d3.select("#auraAttackInput"+capitalizeFirstLetter(side)).property("value"))/100
	}
	
      d['modifiedValue'] = (d['baseValue'] * (1.0 + d['BasePercent']) + d['Absolute'] ) * (1.0 + d['aura'])
      return d
    })
	

    return stat_table_data
  }
  
  
  unit_stats = {}
  unit_tags = {}
  function updateUnitStats(unit, techs, side) {
    stat_table_data = calcUnitStats(unit, techs, side)
    unit_stats[side] = JSON.parse(JSON.stringify(stat_table_data));
    // column definitions
    let columns = [
        { head: 'Statistic', cl: 'left-align', html: d => d['niceName'] },
        { head: 'Base', cl: 'right-align', html: d => d['baseValue'] },
        { head: '+%', cl: 'center', html: function(d){
          if(d['BasePercent']== 0){
             return ''
            }
          return d3.format(".0%")(d['BasePercent'])
         }
         },
        { head: '+abs', cl: 'center', 
        html: function(d){
          if(d['Absolute']== 0){
             return ''
            }
          return d['Absolute']
         }
         },

        { head: 'Aura', cl: 'center', html: function(d){
          if(d['aura']== 0){
             return ''
            }
          return d3.format(".0%")(d['aura'])
         }
         },        { head: 'Modified', cl: 'right-align', html: d => d3.format(".2f")(d['modifiedValue']) },
    ];
  
    // create table
    let table = d3.select('.stats.'+side).html("")
  
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
        .data(stat_table_data).enter()
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
  
    function length() {
        let fmt = d3.format('02d');
        return function(l) { return Math.floor(l / 60) + ':' + fmt(l % 60) + ''; };
    }
  }