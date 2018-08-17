const DW = 466; //Demon's Wheel
const BANDERSNATCH = 46601; // Bandersnatch
const DEMOROS = 46602; //Demoros


const dices = {
	0: {0: 'Hit ALL', 1: 'Don\'t hit RED', 2: 'Hit RED'},	//red dice
	1: {0: 'Hit ALL', 1: 'Don\'t hit BLUE', 2: 'Hit BLUE'},	//blue dice
	2: {0: 'Hit ALL', 1: 'Don\'t hit WHITE', 2: 'Hit WHITE'}	//white dice
};

//Planned call outs: Bandersnatch: Stay in or Get out
//Demoros: LASER
//Demoros: In-out or Out-in
//Demoros: Blue? Not Blue? Red? Not Red? White? Not White? Hit everything

module.exports = function DWGuide(dispatch) {
	const Command = require('command');
	const command = Command(dispatch);
	let boss = null;
	let ball = null;
	let x;
	let y;
	let color; //0: red, 1: blue, 2: white
	let enabled = true;
	let sendToParty = false;
	let sendToPartyC = false;
	let msg;
	let orbit=0; //0: STOP, 1:clockwise, 2:counter-clockwise
	let count=0;
	let circlecount=0;
	
	command.add(['dw','!dw'], () => {
		enabled = !enabled;
		command.message('DW-Guide '+(enabled ? 'enabled' : 'disabled') + '.');
	});
	
	command.add(['dw.party','!dw.party'], () => {
		sendToParty = !sendToParty;
		command.message((sendToParty ? 'Messages will be sent to the party' : 'Only you will see messages'));
	});
	
	command.add(['dw.circles','!dw.circles'], () => {
		sendToPartyC = !sendToPartyC;
		command.message((sendToPartyC ? 'Messages about Circle-Count will be sent to the party' : 'Circle-Count messages to party disabled'));
	});
	
	function sendMessage(msg) {
		if (sendToParty) {
			dispatch.toServer('C_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				message: msg
			});
		} else {
			dispatch.toClient('S_CHAT', 2, {
				channel: 21, //21 = p-notice, 1 = party
				authorName: 'DW-Guide',
				message: msg
			});
		}		
	}
	
	function sendMessageC(msg) {
		setTimeout(function(){
		dispatch.toServer('C_CHAT', 1, {
			channel: 1, //21 = p-notice, 1 = party
			message: msg
		});	}, 3500);
	}
		
	dispatch.hook('S_BOSS_GAGE_INFO', 3, (event) => {
		if (!enabled) return;
		
		if(event.huntingZoneId == DW && (event.templateId == BANDERSNATCH || event.templateId == DEMOROS))
		{
			if(!boss)
			{
				boss = event;
			}
			if (event.templateId == BANDERSNATCH && event.id - boss.id != 0)
			{
				circlecount = 0;
			}
		}
		else if(boss)
		{
			boss = null;
		}
	});
	
	/*function oldtonew(merged_id){
	  skill_id = merged_id & ~(0x04000000 | 0x08000000 | 0x40000000);
	  action_type = (merged_id & (0x04000000 | 0x08000000)) >> 26;
	  is_npc = (merged_id & 0x40000000) == 0x40000000

	  if (action_type == 1){
		if (is_npc){
		  huntingzone_id = (skill_id & 0x03FF0000) >> 16
		  skill_id &= ~0x03FF0000}
		else{
		  huntingzone_id = 0}}
	  else{
		huntingzone_id = 0}

	  return {
		'npc': is_npc,
		'id': skill_id,
		'huntingZoneId': huntingzone_id,
		'type': action_type,
	  }
	}*/
	
	function newtoold(obj = {}) {
        if(typeof obj === 'number') obj = {type: 1, id: obj}

		const hasHuntingZone = Boolean(obj.npc) && obj.type == 1

		let raw = (Number(obj.id) || 0) & (hasHuntingZone ? 0xffff : 0x3ffffff)
		if(hasHuntingZone) raw |= (obj.huntingZoneId & 0x3ff) << 16
		raw |= (obj.type & 0xf) << 26
		raw |= (obj.npc & 1) << 30
		raw |= (obj.reserved & 1) << 31

		return raw
	}
	
	dispatch.hook('S_ACTION_STAGE', 6, (event) => {
		if (!enabled || !boss) return;
		
		if (event.templateId == BANDERSNATCH) {
			
			//let newskillid = event.skill.id;
			event.skill = newtoold(event.skill); // there, fixed the guide :ok_hand:
			//console.log('SKILLID: ' + newskillid + ' old: ' + event.skill);
			//command.message('SKILLID: ' + newskillid + ' old: ' + event.skill);
			
			//systemMessage(''+event.skill);
			//Bandersnatch actions
			//pre 50%
			//1171391770:  1 orange circle 		1306
			//1171391771:  2 blue circles
			//1171391772:  3 red circles
			//1171391773:  4 blue circles
			//1171391774:  5 red circles
			//1171391775:  Red inner explosion	1311
			//1171391776:  Red outer explosion	1312
			//1171391777:  Blue inner explosion
			//1171391778:  Blue outer explosion
			//post 50%
			//1171391779:  Red inner explosion
			//1171391780:  Red outer explosion
			//1171391781:  Blue inner explosion
			//1171391782:  Blue outer explosion
			//1171391783:  1 green circle
			//1171391784:  2 green circles
			//1171391785:  3 green circles
			//1171391786:  4 green circles
			//1171391787:  5 green circles
			
			if (event.skill==1171391775 || event.skill==1171391777 || event.skill==1171391779 || event.skill==1171391781) {
				sendMessage('OUT');
				circlecount = 0;
			}
			else if (event.skill==1171391776 || event.skill==1171391778 || event.skill==1171391780 || event.skill==1171391782) {
				sendMessage('IN');
				circlecount = 0;
			}
			else if (sendToPartyC && event.skill >= 1171391770 && event.skill <= 1171391774) {
				circlecount += (event.skill - 1171391770) + 1;
				sendMessageC(circlecount);
			}
			else if (sendToPartyC && event.skill >= 1171391783 && event.skill <= 1171391787) {
				circlecount += (event.skill - 1171391783) + 1;
				sendMessageC(circlecount);
			}
		}
		else if (event.templateId == DEMOROS) {
			event.skill = newtoold(event.skill); // there, fixed the guide :ok_hand:
			//systemMessage(''+event.skill);
			//1171391577 Laser, 4 times
			if (event.skill==1171391577 || event.skill==1171392577) {
				if(count == 0){
					sendMessage('LASER');
				}
				count+=1;
				if(count == 4) count = 0;
			}
			//1171391773 First Blue Outer-inner explosion
			//1171391774 First Red Outer-inner explosion
			if (event.skill==1171391773 || event.skill==1171391774){
				orbit = 0;
			}
			
			//1171391775 Blue Outer-inner explosion
			//1171391776 Red Inner-outer explosion
			//1171391777 Blue Inner-outer explosion
			//1171391778 Red Outer-inner explosion
			if (event.skill==1171391775 || event.skill==1171391778){
				sendMessage('IN , OUT');
			}
			if (event.skill==1171391776 || event.skill==1171391777){
				sendMessage('OUT , IN');
			}
			//1171391767 Red,Blue,White dice? mech
			if (event.skill==1171391767){
				sendMessage(''+dices[color][orbit]);
			}
			
			//1171391681 Blue circles, 3 times
			//1171391687 Red circles, 3 times
			if (event.skill==1171391687){
				if(count == 0){
					sendMessage('Double RED');
				}
				count+=1;
				if(count == 3) count = 0;
			}
		}
	});
	
	dispatch.hook('S_SPAWN_NPC', 8, (event) => {
		if(!enabled || !boss) return;
		//if(event.huntingZoneId != 11796946) return; // 466 ?
		//46621 clockwise ball
		//46622 counterclockwise ball
		if(event.templateId == 46621){
			ball = event;
			orbit = 1;
		}
		if(event.templateId == 46622){
			ball = event;
			orbit = 2;
		}
	});
	
	dispatch.hook('S_DESPAWN_NPC', 2, (event) => {
		if(!enabled || !boss || !ball) return;
		if(event.gameId - ball.gameId == 0){
			x = event.x;
			y = event.y;
			//systemMessage('x = '+x+' , y = '+y);
			if(Math.abs(x+21927.0)<200 && Math.abs(y-43462.6)<200) color = 0;
			if(Math.abs(x+23881.0)<200 && Math.abs(y-42350.3)<200) color = 0;
			if(Math.abs(x+22896.0)<200 && Math.abs(y-41786.0)<200) color = 1;
			if(Math.abs(x+22911.0)<200 && Math.abs(y-44026.0)<200) color = 1;
			if(Math.abs(x+23847.4)<200 && Math.abs(y-43489.7)<200) color = 2;
			if(Math.abs(x+21960.7)<200 && Math.abs(y-42323.2)<200) color = 2;
			//if(color == 0) systemMessage('RED');
			//if(color == 1) systemMessage('BLUE');
			//if(color == 2) systemMessage('WHITE');
			sendMessage(''+dices[color][orbit]);
			ball = null;
		}
	});
	
	
}
