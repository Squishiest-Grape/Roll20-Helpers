if (!(state.Macros)) { state.Macros = {} }

state.Macros['Test'] = {fun:test,vis:'GM',txt:''}

function test(args,id,sel){
    if (!(sel)){ return }  
    var obj = getObj(sel[0]._type,sel[0]._id)
    log(obj)
}


var turns = {}
var locked = {}
var speeds = {}

if (!(state.Macros)) { state.Macros = {} }

state.Macros['Speed'] = {fun:set_speed,vis:'all',txt:'?{Change Speed}'}
state.Macros['Back'] = {fun:back_turn,vis:'all',txt:''}
state.Macros['Give_Turn'] = {fun:give_turn,vis:'GM',txt:''}

on('change:campaign:turnorder',function(obj){
    var data = JSON.parse(obj.get('turnorder'))
    var id = data[0]._id
    turns = {}; locked = {}
    add_turn(id)
    for (var i=1; i<data.length; i++){
        var id = data[i]._id
        locked[id] = 0
    }
})

on('change:graphic:lastmove',function(obj,prev){
    var id = obj.get('id')
    if (id in locked) {
        obj.set({lastmove:'',top:prev['top'],left:prev['left']})
    } else if (id in turns) {
        var scale = 70/getObj('page',obj.get('pageid')).get('scale_number')
        var speed = (speeds[id] - turns[id].speed)* scale
        var path = GetPathArray(obj)
        [path_new,dist] = AlongPath(path,speed)
        var l = path_new.length
        var T = path_new[l-1]
        var L = path_new[l-2]
        var D = speed - dist
        turns[id].path.push({T:T,L:L,D:D})
        obj.set({lastmove:'',top:T,left:L})
        turns[id].speed = dist
        ShowSpeed(obj,dist)
    }
})


function add_turn(id){
    turns[id] = {speed:0,path:[]}
    var obj = getObj('graphic',id)
    ShowSpeed(obj,speeds[id])
    if (id in locked){ delete locked[id] }
}
function lock(id){
    locked[id] = 0
    var obj = getObj('graphic',id)
    ShowSpeed(obj,0)
}

function back_turn(args,id,sel){
    if (!(sel)){ return }
    for (var i in sel){
        var id = sel[0]._id
        add_turn(id)
    }
}


function set_speed(args,id,sel){
    if (!(sel)){ return }
    for (var i in sel){
        var id = sel[0]._id
        var speed = safeFloat(args[0])
        var ds = speed - speeds[id]
        speeds[id] += ds
        if (id in turns){
            var speed = speeds[id] - turns[id].speed
            var obj = getObj('graphic',id)
            ShowSpeed(obj,speed)
        }
        
        
    }
}

function give_turn(args,id,sel){
    if (!(sel)){ return }
    for (var i in sel){
        var id = sel[0]._id
        add_turn(id)
    }
}

function GetPathArray(obj){
    var path = obj.get('lastmove').split(',').map(Number)
    path.push(obj.get('left'),obj.get('top'))
    return path
}

function AlongPath(path,dist,mult=1){
    var L = path.length
    var path_new = [[path[0],path[1],0]]
    for (var i=2; i<L-1; i+=2){
        var dx = path[i]-path[i-2]
        var dy = path[i+1]-path[i-1]
        var d = Math.sqrt(dx*dx+dy*dy)*mult
        if (d >= dist){
            path_new.push([path[i-2]+dx*dist/d,path[i-1]+dy*dist/d,dist])
            return [path_new,0]
        } else {
            path_new.push([path[i],path[i+1],d])
            dist -= d
        }
    }
    return [path_new,dist]
}

function ShowSpeed(obj,speed){
    if (speed) {
        obj.set({aura2_radius:speed})
    } else {
        obj.set({aura2_radius:''})
    }
        
}




