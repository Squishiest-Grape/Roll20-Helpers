var turns = {}
var locked = {}
var speeds = {}
var attached = {}

if (!(state.Macros)) { state.Macros = {} }

state.Macros['Speed'] = {fun:set_speed,vis:'all',txt:'?{Change Speed}'}
state.Macros['Back'] = {fun:back_turn,vis:'all',txt:''}
state.Macros['Give_Turn'] = {fun:give_turn,vis:'GM',txt:''}
state.Macros['Attach'] = {fun:attach,vis:'GM',txt:''}

on('change:campaign:turnorder',function(obj){
    var data = JSON.parse(obj.get('turnorder'))
    var id = data[0].id
    log(data)
    turns = {}; locked = {}
    add_turn(id)
    for (var i=1; i<data.length; i++){
        var id = data[i].id
        lock(id)
    }
})

on('change:campaign:initiativepage',function(obj){
    log(obj)
    if (!(obj.get('initiativepage'))) {
        for (id in turns) {
            delete turns[id]
            ShowSpeed(id) 
        }
        locked = {}
    }
})

on('change:graphic:lastmove',function(obj,prev){
    var id = obj.get('id')
    if (id in locked) {
        obj.set({lastmove:'',top:prev['top'],left:prev['left']})
    } else if (id in turns) {
        var scale = 70/getObj('page',obj.get('pageid')).get('scale_number')
        var speed = 30; if(id in speeds) { speed = speeds[id] }
        speed = (speed - turns[id].speed) * scale
        var path = GetPathArray(obj)
        var [path_new,dist] = AlongPath(path,speed)
        var l = path_new.length
        var T = path_new[l-1][1]
        var L = path_new[l-1][0]
        obj.set({lastmove:'',top:T,left:L})
        turns[id].path.pop()
        turns[id].path.push(...path_new)
        var D = (speed - dist)/scale
        turns[id].speed += D
        ShowSpeed(id)
    }
})


function add_turn(id){
    turns[id] = {speed:0,path:[]}
    ShowSpeed(id)
    if (id in locked){ delete locked[id] }
}
function lock(id){
    locked[id] = 0
    ShowSpeed(id)
}

function back_turn(args,id,sel){
    for (var i in sel){
        var id = sel[0]._id
        if (id in turns){
            if (turns[id].path.length>1){
                var obj = getObj('graphic',id)
                var scale = 70/getObj('page',obj.get('pageid')).get('scale_number')
                var path = turns[id].path.pop()
                turns[id].speed -= path[2]/scale
                path = turns[id].path[turns[id].path.length-1]
                obj.set({left:path[0],top:path[1]})
                ShowSpeed(id)
            }
        }
    }
}


function set_speed(args,id,sel){
    for (var i in sel){
        var id = sel[0]._id
        var speed = safeFloat(args[0])
        speeds[id] = speed
        if (id in turns){
            ShowSpeed(id)
        }
    }
}

function give_turn(args,id,sel){
    for (var i in sel){
        var id = sel[0]._id
        add_turn(id)
    }
}

function attach(args,id,sel){
    if (!(sel)){ return }
    if (sel.length < 2){
        var ids = []
        for (i in sel){ ids.push(sel[i]._id) }
        for (i in ids){
            var id = ids[i]
            var A = attached[id] | []
            for (i in ids){
                if (ids[i]==id) { continue }
                var ind = A.indexOf(inds[i])
                if (ind < 0) { A.push(inds[i]) }
                else { A.splice(ind,1) }
            }
        }
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

function ShowSpeed(id){
    var obj = getObj('graphic',id)
    if (id in turns){
        var speed = 30
        if (id in speeds) { speed = speeds[id]}
        speed -= turns[id].speed
        obj.set({aura2_radius:speed})
    } else {
        obj.set({aura2_radius:''})
    }
}




