

var teles = {ids:[],pages:{},chains:{}}
var tokens = findObjs({type:'graphic',subtype:'token'})
for (var i=0; i<=tokens.length; i++){
    var token = tokens[i]
    var name = token.get('name')
    if (name.substr(0,2)=='T/'){
        var chain = name.substr(2,name.length-2)
        var from = name.charAt(name.length-2)
        var to = name.charAt(name.length-1)
        var page = token.get('page')
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







on('change:graphic:lastmove',function(obj){
    if (!(teles.ids.includes(obj.get('id')))) {
        var T1 = obj.get('top')
        var L1 = obj.get('left')
        var S1 = Math.max(obj.get('width'),obj.get('height'))
        var page = obj.get('pageid')
        for (var id in teles[page]) {
            var tele = getObj('graphic',id)
            var T2 = tele.get('top')
            var L2 = tele.get('left')
            var S2 = Math.max(tele.get('width'),tele.get('height'))
            if (Touching(T1,L1,S1,T2,L2,S2)){
                var dT = T1-T2
                var dL = L1-L2               
                var chain = teles.pages[page][id].chain
                var to = teles.pages[page][id].to
                var tele = getObj('graphic',teles.chains[chain][to])
                var page = tele.get('pageid')
                var T3 = tele.get('top')
                var L3 = tele.get('left')
                obj.set({top:T3+dT,left:L3+dL,pageid:page})
                return undefined
            }
        }
    }
})


function Touching(T1,L1,S1,T2,L2,S2){
    if ( Math.abs(T2-T1)>S1+S2 || Math.abs(L2-L1)>S1+S2 )  { return false }
    if ( Math.sqrt((T2-T1)*(T2-T1)+(L2-L1)*(L2-L1))>S1+S2 ) {return false } 
    return true
}