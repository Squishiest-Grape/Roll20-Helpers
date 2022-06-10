var teles = {ids:[],pages:{},chains:{}}


on('ready',function(){
    var tokens = findObjs({type:'graphic',subtype:'token'})
    for (var i=0; i<tokens.length; i++){
        var token = tokens[i]
        var name = token.get('name')
        if (name.substr(0,2)=='T/'){
            var chain = name.substr(2,name.length-4)
            var from = name.charAt(name.length-2)
            var to = name.charAt(name.length-1)
            var page = token.get('pageid')
            if (!(page in teles.pages)) { 
                teles.pages[page] = {}
                teles.pages[page][token.id] = {chain:chain,to:to}
            } else {
                teles.pages[page][token.id] = {chain:chain,to:to}
            }
            if (!(chain in teles.chains)) { teles.chains[chain] = {} }
            teles.chains[chain][from] = token.id
            teles.ids.push(token.id)
        }
    }
})




on('change:graphic:lastmove',function(obj){
    if (!(teles.ids.includes(obj.get('id')))) {
        var T0 = obj.get('top')
        var L0 = obj.get('left')
        var S0 = Math.max(obj.get('width'),obj.get('height'))/2
        var P0 = obj.get('pageid')
        for (var id in teles.pages[P0]) {
            var tele1 = getObj('graphic',id)
            var T1 = tele1.get('top')
            var L1 = tele1.get('left')
            var S1 = Math.max(tele1.get('width'),tele1.get('height'))/2
            if (Touching(T0,L0,S0,T1,L1,S1)){
                var dT = T0-T1
                var dL = L0-L1
                var chain = teles.pages[P0][id].chain
                var to = teles.pages[P0][id].to
                if (!(to in teles.chains[chain])) { return }
                tele2 = getObj('graphic',teles.chains[chain][to])
                var T2 = tele2.get('top')
                var L2 = tele2.get('left')
                var P2 = tele2.get('pageid')
                var dw = tele2.get('width')/tele1.get('width')
                var dh = tele2.get('height')/tele1.get('height')
                var dr = tele2.get('rotation')-tele1.get('rotation')
                MoveGraphicPage(obj,P2,T2+dT,L2+dL,dw,dh,dr)
            }
        }
    }
})

function MoveGraphicPage(obj,page,top,left,dw,dh,dr){
    if (obj.get('pageid')==page){
        obj.set({top:top,left:left,width:obj.get('width')*dw,height:obj.get('height')*dh,rotation:obj.get('rotation')-dr})
    } else {
        var params = JSON.parse(JSON.stringify(obj))
        params.imgsrc = params.imgsrc.replace(/med|max/,'thumb');
        params._pageid = page
        params.top = top
        params.left = left
        params.width = params.width*dw
        params.height = params.height*dh
        params.rotation = params.rotation-dr
        params.lastmove = ''
        var obj_new = createObj('graphic',params)
        if (!obj_new) { return }
        toFront(obj_new)
        obj.remove()
        var players = ''
        if (obj_new.get('represents')!=''){ players = getObj('character',obj_new.get('represents')).get('controlledby') } 
        else {players = obj_new.get('controlledby') }
        players = players.split(',')
        var psp = Campaign().get('playerspecificpages') || {}
        for (var p in players){
            var player = players[p]
            if (player != 'all'){
                psp[player] = page
            }
        }
        Campaign().set('playerspecificpages',false)
        Campaign().set('playerspecificpages',psp)
    }
}



function Touching(T1,L1,S1,T2,L2,S2){
    if ( Math.abs(T2-T1)>S1+S2 || Math.abs(L2-L1)>S1+S2 )  { return false }
    if ( Math.sqrt((T2-T1)*(T2-T1)+(L2-L1)*(L2-L1))>S1+S2 ) { return false } 
    return true
}



on('chat:message', function(msg) {
    if (msg.type=='api' && msg.content == '!T'){
        var objs = msg.selected
        var obj = getObj('graphic',objs[0]._id)
        log(obj)
    }
})