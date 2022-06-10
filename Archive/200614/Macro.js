/*
_________ To add macros on any sheet ___________________________________________

if (!(state.Macros)) { state.Macros = {} }

state.Macros['Macro'] = {fun:Function,vis:'GM/all/ids',txt:'Argument1 Argument2 ...'}
...

function Function(['Argument1','Argument2',...],Player_ID,Selected){ Do Stuff }
...

*/

if (!(state.Macros)) { state.Macros = {} }

state.Macros['Test'] = {fun:test,vis:'GM',txt:''}
state.Macros['Edit'] = {fun:edit,vis:'GM',txt:''}


function test(args,id,sel){
    for (var i in sel){
        var obj = getObj(sel[i]._type,sel[i]._id)
        log(obj)
    }
}

function edit(args,id,sel){
    for (var i in sel){
        var id = sel[i]._id
        if (id in state.Area.Refs) {
            var obj = state.Area.Areas[state.Area.Refs[id]]
            edit_area(obj)
        } else if (id in state.Char.Refs) {
            var obj = state.Char.Chars[state.Char.Chars[id]]
            edit_char(obj)
        
        
        
    }
}










on('chat:message', function(msg) {
    if (msg.type=='api' && msg.content.startsWith('!MacroCall')){
        var data = msg.content.split(' ')
        state.Macros[data[1]].fun(data.slice(2),msg.playerid,msg.selected)
    }
})

on('ready',function(){
    if (state.Macros){ add_macros(state.Macros) }
})

function add_macros(macros){
    // get GM ids
    var GMs = []
    var objs = findObjs({type:'player'})
    for (var i in objs){ 
        var id = objs[i].get('id')
        if(playerIsGM(id)) { GMs.push(id) } 
    }
    // create the macros
    for (var name in macros) {
        // remove copies
        var objs = findObjs({type:'macro',name:name})
        for (i in objs) { objs[i].remove() }
        // save macro
        var vis = macros[name].vis; if ( vis == 'GM') { vis = GMs.join() }
        var action = '!MacroCall '+name+' '+macro_fix_0(macros[name].txt)
        createObj('macro',{playerid:GMs[0],name:name,visibleto:vis,action:action})
    }
}

function macro_fix_0(txt){
    var ans = ''
    var temp = ''
    var count = 0
    for (i in txt){
        var c = txt[i]
        if (count==0){
            if (c=='{'){ count++ }
            else { ans += c }
        } else {
            if (c=='}'){
                count--
                if (count==0){ ans += '{'+macro_fix_1(temp)+'}'; temp = '' }
                else { temp += c }
            } else {
                temp += c
                if (c=='{'){ count++ }
            }
        }
    }
    return ans
}
function macro_fix_1(txt){
    var ans = ''
    var temp = ''
    var count = 0
    for (i in txt){
        var c = txt[i]
        if (count==0){
            if (c=='{'){ count++ }
            else { ans += c }
        } else {
            if (c=='}'){
                count--
                if (count==0){ ans += '{'+macro_fix_2(temp)+'&#125;'; temp = '' }
                else { temp += c }
            } else {
                temp += c
                if (c=='{'){ count++ }
            }
        }
    }
    return ans
}
function macro_fix_2(txt){
    var ans = ''
    var temp = ''
    var count = 0
    for (i in txt){
        var c = txt[i]
        if (count==0){
            if (c=='{'){ count++ }
            else { ans += c }
        } else {
            if (c=='}'){
                count--
                if (count==0){ ans += '{'+macro_fix_3(temp)+'}'; temp = '' }
                else { temp += c }
            } else {
                temp += c
                if (c=='{'){ count++ }
            }
        }
    }
    ans = ans.replace(/[|]/g,'&#124;')
    ans = ans.replace(/[,]/g,'&#44;')
    ans = ans.replace(/[}]/g,'&#125;')
    ans = ans.replace(/[@]/g,'#64;')
    
    
    return ans
}
function macro_fix_3(ans){
    ans = ans.replace(/[|]/g,'&#124;')
    ans = ans.replace(/[,]/g,'&#44;')
    ans = ans.replace(/[}]/g,'&#125;')
    ans = ans.replace(/[@]/g,'#64;')
    ans = ans.replace(/[&]/g,'&amp;')
    return ans
}

