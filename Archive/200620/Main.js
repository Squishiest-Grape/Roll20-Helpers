// initalize everything
var AdvTkn_main
var AdvTkn_area
var AdvTkn_char
var AdvTkn_move
on('ready',function(){
    AdvTkn_main = new AdvTkn_Main()
    // AdvTkn_area = new AdvTkn_Area(AdvTkn_main)
    
    // create macros
    AdvTkn_main.add_macros(AdvTkn_main.Macros)
})


// set up intermediary to turn macros to function calls
on('chat:message', function(msg) {
    if (msg.type=='api' && msg.content.startsWith('!MacroCall')){
        var data = msg.content.split(' ')
        AdvTkn_main.Macros[data[1]].fun(data.slice(2),msg.playerid,msg.selected)
    }
})  

// create class wrapper
class AdvTkn_Main {

    // intialize everything
    constructor() {

        // set settings and usefull values
        this.mask = 'AdvTkn'
        this.ipx = 'https://s3.amazonaws.com/files.d20.io/images/129234422/z67Jv24VGn2L0IDaWpd4gw/thumb.png?15882542305'
        
        // store values to state
        state = {} // refresh (remove later)
        if (!state[this.mask]) { 
            state[this.mask] = {
                Macros: {}
            } 
        }
        this.Macros = state[this.mask].Macros
    
        // save macros    
        this.Macros['Test'] = {fun:this.test,vis:'GM',txt:''}
        
        

    }

    // add macros
    add_macros(macros){
        
        // get GM ids
        var GMs = []
        var objs = findObjs({type:'player'})
        for (var i in objs){ 
            var id = objs[i].get('id')
            if(playerIsGM(id)) { GMs.push(id) } 
        }
        // delete all macros
        var objs = findObjs({type:'macro'})
        for (var i in objs){ objs[i].remove() }
        
        // create the macros
        for (var name in macros) {
            // delete copies (remove)
            var objs = findObjs({type:'macro',name:name})
            for (i in objs) { objs[i].remove() }
            // save macro
            var vis = macros[name].vis; if ( vis == 'GM') { vis = GMs.join() }
            var action = '!MacroCall '+name+' '+this.macro_fix_0(macros[name].txt)
            createObj('macro',{playerid:GMs[0],name:name,visibleto:vis,action:action})
        }
    }

    // test function to log selected values
    test(args,playerid,selected){
        for (var i in selected){
            var obj = getObj(selected[i]._type,selected[i]._id)
            log(obj)
        }
    }

    // function to fix text in macro
    macro_fix_0(txt){
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
                    if (count==0){ ans += '{'+this.macro_fix_1(temp)+'}'; temp = '' }
                    else { temp += c }
                } else {
                    temp += c
                    if (c=='{'){ count++ }
                }
            }
        }
        return ans
    }
    macro_fix_1(txt){
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
                    if (count==0){ ans += '{'+this.macro_fix_2(temp)+'&#125;'; temp = '' }
                    else { temp += c }
                } else {
                    temp += c
                    if (c=='{'){ count++ }
                }
            }
        }
        return ans
    }
    macro_fix_2(txt){
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
                    if (count==0){ ans += '{'+this.macro_fix_3(temp)+'}'; temp = '' }
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
    macro_fix_3(ans){
        ans = ans.replace(/[|]/g,'&#124;')
        ans = ans.replace(/[,]/g,'&#44;')
        ans = ans.replace(/[}]/g,'&#125;')
        ans = ans.replace(/[@]/g,'#64;')
        ans = ans.replace(/[&]/g,'&amp;')
        return ans
    }

}
