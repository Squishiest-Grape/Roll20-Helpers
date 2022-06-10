// delete(state.CharacterPlus)



// initial settup matrix (only used upon first load)
if (!(state.CharacterPlus)){
    state.CharacterPlus = {}
    state.CharacterPlus.characters = {}
    state.CharacterPlus.refrences = {}
    state.CharacterPlus.turns = {}
    state.CharacterPlus.sights = {}
    state.CharacterPlus.senses = {}
    state.CharacterPlus.settings = {}
    var sights = state.CharacterPlus.sights
    sights.has =      {'true':{},magic:{}}
    sights.shown_by = {'true':{},magic:{}}
    var senses = state.CharacterPlus.senses
    senses.has =        {sound:{},tremor:{},smell:{},other:{},magic:{}}
    senses.shown_by =   {sound:{},tremor:{},smell:{},other:{},magic:{}}
    var settings = state.CharacterPlus.settings
    settings.freeze_scope =         'character' // character, token
    settings.freeze_turn =          true        //bool
    settings.limit_speed =          true        // bool
    //settings.free_vision =          false       // bool (based on sheet)
    settings.free_rotation =        false       // bool
    settings.select_prevention =    false       // bool
    settings.show_movement =        false
    settings.speed_change_ctrl =    'player'    // player, ask, dm
    settings.speed_color =          '#6d9eeb'   // hex based color
    settings.range_color =          '#e06666'   // hex based color
    settings.default_speed =        30          // number >= 0
    settings.default_range =        5           // number >= 0
    settings.default_sight_angle =  120         // number 0-360
}


// load from last session
var characters = state.CharacterPlus.characters
var refrences = state.CharacterPlus.refrences
var turns = state.CharacterPlus.turns
var sight = state.CharacterPlus.sight
var setting = state.CharacterPlus.settings

// refrence variables
var parts_movable = ['main','mask']



var GM_id = ''

on('ready',function(){
    var GM_id = filterObjs(function(obj){
        if (obj.get('type')=='player' && playerIsGM(obj.get('id'))) { return true }
        else {return false }
    })[0].get('id')
    
    
    if(findObjs({type:'macro',name:'test'}).length==0){
        createObj('macro',{
            playerid:GM_id,
            name:'test',
            action:'Choose ?{Num|1|Other,?{2|3&#125;}'
        })
    }
    

})


// get character object given id or make new character
function GetCharacter(id){
    if (id in refrences[id]){
        id = refrences[id]
        return characters[id]
    } else {
        // copy token parameters
        characters[id] = {}
        refrences[id] = id
        var char = characters[id]
        params = ['pageid','left','top','rotation','width','height','controlledby',
                  'represents','light_radius','light_dimradius','light_otherplayers',
                  'light_hassight','light_angle','light_losangle','light_multiplier',
                  'adv_fow_view_distance']
        CopyParams(char,getObj('graphic',id),params)
        char.parts = {id:'main'}
        char.followed = {}
        char.stats = {
            speed:30,
            range:5,
            sight_angle:120,
            dim_range:0,
            dark_range:0
        }
        char.sights = {}
        char.senses = {}
        char.attributes = {
            corporial:true,
            silent:false,
            flying:false,
            smell:true
        }
        char.states = {
            corpotial:true,
            silent:false,
            flying:false,
            smell:true,
        }
        shown_to = []
        hidden_from = []
        char.blind = false
        char.locked = false
        char.invis = false
        char.settings = {
            show_speed:'turn',
            show_range:'turn'
        }
        return char
    }
}





function CopyParams(obj1,obj2,params){
    for (var p=0;p<params.length;p++){
        obj1[params[p]] = obj2[params[p]]
    }
}


function Update(obj){
    // update via settings
}

function Freeze(obj,arg){
    // turn move property of object to arg
}

function Invis(obj,args){
    // change invisibility
}

function Follow(obj,obj,dist=0){
    // toggle object to follow
}


on('change:graphic:lastmove',function(obj){
    var id = obj.get('id')
    if (id in refrences){
        var char_id = refrences[id]
        var char = characters[char_id]
        if (parts_movable.includes(char.parts[id]) && !char.locked){
    


            
            
            
            
            var path = ''
            if (char_id in turns && turns[char_id] != false) {
                var speed = turns[char_id].speed
                var mult = turns[char_id].mult
                var data = AlongPath(GetPathArray(obj),speed,mult)
                turns[char_id].speed = data[1]
                turns[char_id].path.push.apply(turns[char_id].path,data[0].shift())





            } else {
                var pos = [obj.get('left'), obj.get('top')]
                if (settings.show_movement){
                    var path = obj.get('lastmove')
                }
            }
            Move(char,id,pos,path)
        } else {
            obj.set({left:char.left,top:char.top,lastmove:''})
        }
    } else {
        if (!(settings.show_movement)){
            obj.set('lastmove','')
        }
    }
})

function MoveChar(char,skip_id,pos,path){
    // move
}


function GetPathArray(obj){
    var path = obj.get('lastmove').split(',').map(Number)
    path.push(obj.get('left'),obj.get('top'))
    return path
}

function GetPathString(path){
    var string = ''
    for (var i=0; i<path.length-1; i++){
        string += path[i][0].toString() + ',' + path[i][1].toString()
    }
    return string
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
