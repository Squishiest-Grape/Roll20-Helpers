// create wrapper
AdvTkn = (function() {

    // __________________________ Settings _______________________________________

    // main script settings
    var refresh = true     // refresh all saved data and macros 
    var mask = 'AdvTkn'     // name to hide all data from script
    
    // area settings
    var handle_size = 2    // unit
    var line_width = 3     // pnts
    var show_token = true  // 

    // __________________________ Initialize _______________________________________

    if (!state[mask]) { refresh = true }

    // store values to state
    if (refresh) {
        state[mask] = {
            refs: {},   // refrences to other data
            areas: {},  // area data
            shapes: {
                Invisible:  '', 
                Circle:     '',
                Rectangle:  '',
                Triangle:   '',
                Hexagon:    '',
            }, // saved shape tokens
            players: {}, // saved player info
        } 
    }
    // make state data easier to refrence
    var _refs = state[mask].refs
    var _areas = state[mask].areas
    var _shapes = state[mask].shapes
    var _players = state[mask].players

    // add shapes (for dev)
    _shapes = {
        Invisible: 'https://s3.amazonaws.com/files.d20.io/images/129234422/z67Jv24VGn2L0IDaWpd4gw/thumb.png?1588254230',
        Circle: 'https://s3.amazonaws.com/files.d20.io/images/149775440/S2wCB7TmW8dJc1W9YBzEUw/thumb.png?1594505612',
        Rectangle: 'https://s3.amazonaws.com/files.d20.io/images/149775441/ANpkVr3h96vK-dwFrbStOQ/thumb.png?1594505611',
        Triangle: 'https://s3.amazonaws.com/files.d20.io/images/149775442/-gyNv328flmnoS-V8jF0DQ/thumb.png?1594505611',
        // Hexagon: 'https://s3.amazonaws.com/files.d20.io/images/149775443/NUC6AZk31qEitz61BmQjVg/thumb.png?1594505611',
    }


    // __________________________ General Classes __________________________________

    var Pnt = function(x,y) {
        return {x:x,y:y}
    }
    var Line = function(pnt1,pnt2) {
        return {pnt1:pnt1,pnt2:pnt2}
    }
    var Circle = function(pnt,r=0) {
        return {pnt:pnt,r:r}
    }
    var Poly = function(pnts,r=0) {
        return {pnts:pnts,r:r}
    }
    var Path = function(pnts,r=0) {
        return {pnts:pnts,r:r}
    }
    var Shape = function(type,data) {
        data.type = type
        switch (type) {
            case 'circle':
                data.xmin = data.pnt.x - data.r
                data.xmax = data.pnt.x + data.r
                data.ymin = data.pnt.y - data.r
                data.ymax = data.pnt.y + data.r
                break
            case 'poly':
                var [xmin,xmax,ymin,ymax] = pnt_limits(data.pnts)
                data.xmin = xmin - data.r
                data.xmax = xmax + data.r
                data.ymin = ymin - data.r
                data.ymax = ymax + data.r
                data.pnt = Pnt((xmax+xmin)/2,(ymax+ymin)/2)
                data.pnts = clockwise(data.pnts)
                var temp = scale_pnts(data.pnts)
                data.pos = temp[0]; data.neg = temp[1]
                break
            case 'path':
                var [xmin,xmax,ymin,ymax] = pnt_limits(data.pnts)
                data.xmin = xmin - data.r
                data.xmax = xmax + data.r
                data.ymin = ymin - data.r
                data.ymax = ymax + data.r
                data.pnt = Pnt((xmax+xmin)/2,(ymax+ymin)/2)
                data.pos = scale_pnts(data.pnts,false)
                break
        }
        return data
    }
    var Area = function(parts={},shape_outer,shape_inner=[]) {
        data = {type:'area'}
        data.parts = parts
        data.shape_outer = shape_outter
        data.shape_inner = shape_inner
        return data
    }
    
    // __________________________ Utility Functions ________________________________

    var add_macros = function(){
        // get GM ids
        var GMs = []
        var objs = findObjs({type:'player'})
        for (var i in objs){ 
            var id = objs[i].get('id')
            if(playerIsGM(id)) { GMs.push(id) } 
        }
        // create the macros
        for (var name in macros) {
            // delete old
            var objs = findObjs({type:'macro',name:name})
            for (var i in objs) { objs[i].remove() }
            // save macro
            var vis = macros[name].vis
            if (vis){
                if ( vis == 'GM') { vis = GMs.join() }
                var action = '!'+mask+' '+name+' '+macro_fix_0(macros[name].txt)
                createObj('macro',{playerid:GMs[0],name:name,visibleto:vis,action:action,istokenaction:macros[name].ta})
            } 
        }
    }
    var macro_fix_0 = function(txt) {
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
    var macro_fix_1 = function(txt) {
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
    var macro_fix_2 = function(txt) {
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
    var macro_fix_3 = function(ans) {
        ans = ans.replace(/[|]/g,'&#124;')
        ans = ans.replace(/[,]/g,'&#44;')
        ans = ans.replace(/[}]/g,'&#125;')
        ans = ans.replace(/[@]/g,'#64;')
        ans = ans.replace(/[&]/g,'&amp;')
        return ans
    }

    var dec = function(i,l) {
        i = parseInt(i)
        if (i > 0) { return (i - 1)|0 } 
        else { return (l - 1 - i)|0 }
    }
    var inc = function(i,l) {
        i = parseInt(i)
        if (i < l-1) { return (i + 1)|0 } 
        else { return (i - l + 1)|0 }
    }
    var safeFloat = function(val) {
        val = parseFloat(val)
        if (!val) { val = 0 }
        return val
    }
    var copy = function(obj){
        return JSON.parse(JSON.stringify(obj))
    }


    // __________________________ Vector Functions ________________________________

    var add_pnts = function(pnt1,pnt2) {
        return Pnt(pnt1.x+pnt2.x,pnt1.y+pnt2.y)
    }
    var sub_pnts = function(pnt1,pnt2) {
        return Pnt(pnt1.x-pnt2.x,pnt1.y-pnt2.y)
    }
    var inv_pnt = function(pnt) {
        return Pnt(-pnt.y,pnt.x)
    }
    var neg_pnt = function(pnt) {
        return Pnt(-pnt.x,-pnt.y)
    }
    var pnts_eq = function(pnt1,pnt2) {
        if (pnt1.x==pnt2.x && pnt1.y==pnt2.y) { return true } else { return false }
    }

    var left = function(pnt,line) {
        return Math.sign( (line.pnt1.x-pnt.x)*(line.pnt2.y-pnt.y) - (line.pnt2.x-pnt.x)*(line.pnt1.y-pnt.y))
    }

    var rotate_pnts = function(pnts,ref,R) {
        var new_pnts = []
        var sin = Math.sin(R*Math.PI/180)
        var cos = Math.cos(R*Math.PI/180)
        for (var p in pnts){
            var dx = pnts[p].x - ref.x
            var dy = pnts[p].y - ref.y
            var x = ref.x + (dx*cos - dy*sin)
            var y = ref.y + (dy*cos + dx*sin)
            new_pnts.push(Pnt(x,y))
        }
        return new_pnts
    }

    var unit = function(line) {
        var dx = line.pnt2.x - line.pnt1.x
        var dy = line.pnt2.y - line.pnt1.y
        var d = Math.sqrt(dx*dx+dy*dy)
        if (d==0){
            return Pnt(0,0)
        } else {
            return Pnt(dx/d,dy/d)
        }
    }

    var move_pnts = function(pnts,dirs,scale=1) {
        var ans = []
        if (Array.isArray(dirs)){
            for (var p in pnts){ ans.push(Pnt(pnts[p].x+dirs[p].x*scale,pnts[p].y+dirs[p].y*scale)) }
        } else {
            for (var p in pnts){ ans.push(Pnt(pnts[p].x+dirs.x*scale,pnts[p].y+dirs.y*scale)) }
        }
        return ans
    }

    var pnt_limits = function(pnts) {
        var xmin = Infinity
        var xmax = -Infinity
        var ymin = Infinity
        var ymax = -Infinity
        for (var p in pnts){ 
            if (pnts[p].x < xmin) { xmin = pnts[p].x }
            if (pnts[p].x > xmax) { xmax = pnts[p].x }
            if (pnts[p].y < ymin) { ymin = pnts[p].y }
            if (pnts[p].y > ymax) { ymax = pnts[p].y }
        }
        return [xmin,xmax,ymin,ymax]    
    }

    // __________________________ Geometric Functions ________________________________

    var path_2_shape = function(obj,length=undefined){
        // collect object info
        var S = getObj('page',obj.get('pageid')).get('scale_number')
        var R = obj.get('rotation')
        var T = obj.get('top')
        var L = obj.get('left')
        var sX = obj.get('scaleX')
        var sY = obj.get('scaleY')
        var h = obj.get('height')
        var w = obj.get('width')
        var path = JSON.parse(obj.get('path'))
        // check if circle
        if (path[1][0]=='C'){
            r = (h*sY + w*sX)/4
            return Shape('circle', Circle( Pnt(T,L),r))
        }
        // generate points for poly and path
        var pnts = []
        for (var p in path){
            pnts.push(Pnt(path[p][2],path[p][1])) 
        }
        // rotate, move, and scale
        var [xmin,xmax,ymin,ymax] = pnt_limits(pnts)
        var sin = Math.sin(-R*Math.PI/180)
        var cos = Math.cos(-R*Math.PI/180)
        for (var p in pnts){
            var t = (pnts[p].x - xmin - h/2)*sY
            var l = (pnts[p].y - ymin - w/2)*sX
            var t_p = T + (t*cos - l*sin)
            var l_p = L + (t*sin + l*cos)
            pnts[p] = Pnt(t_p,l_p)
        }
        if (length) { pnts = limit_length(pnts,length) }
        // check if polygon
        if (pnts_eq(pnts[0],pnts[pnts.length-1])){
            return Shape('poly',Poly(pnts.slice(0,-1)))
        } else {
            return Shape('path',Path(pnts))
        }
    }

    var shape_2_path = function(shape,page,color,controlled,R=0,T=0,L=0){
        switch(shape.type) {
            case 'circle':
                const d = (1-Math.tan(Math.PI/8)*4/3)
                const circ_path_ref = [0,1,0,d,d,0,1,0,2-d,0,2,d,2,1,2,2-d,2-d,2,1,2,d,2,0,2-d,0,1]
                var path = []
                for (var i in circ_path_ref){ path.push(circ_path_ref[i]*shape.r) }
                path = JSON.stringify([ ['M',path[0],path[1]],
                                        ['C',path[2],path[3],path[4],path[5],path[6],path[7]],
                                        ['C',path[8],path[9],path[10],path[11],path[12],path[13]],
                                        ['C',path[14],path[15],path[16],path[17],path[18],path[19]],
                                        ['C',path[20],path[21],path[22],path[23],path[24],path[25]] ])
                var obj = createObj('path',{
                    pageid: page,
                    path: path,
                    stroke: color,
                    layer: 'objects',
                    stroke_width: line_width,
                    width: shape.r*2,
                    height: shape.r*2,
                    rotation: R,
                    top: shape.pnt.x+T,
                    left: shape.pnt.y+L,
                    controlledby: controlled
                })
                return obj
            case 'poly':
                var w = shape.ymax-shape.ymin
                var h = shape.xmax-shape.xmin
                var x = shape.pnt.x
                var y = shape.pnt.y
                var path = []
                if (shape.r==0) {
                    for (var i in shape.pnts){ path.push(['L',shape.pnts[i].y,shape.pnts[i].x]) }
                    path.push(['L',path[0][1],path[0][2]])
                } else {
                    var pnts; var lines
                    if (shape.r>0) { pnts = move_pnts(shape.pos.pnts,shape.pos.dirs,shape.r); lines = shape.pos.lines }
                    else     { pnts = move_pnts(shape.neg.pnts,shape.neg.dirs,-shape.r); lines = shape.neg.lines }
                    var path = [['M',pnts[lines[0].inds[0]].y,pnts[lines[0].inds[0]].x]]
                    for (var i in lines) {
                        if (lines[i].type == 'L'){
                            path.push(['L',pnts[lines[i].inds[1]].y,pnts[lines[i].inds[1]].x])
                        } else {
                            path.push(...arcs_2_bezier(shape.pnts[lines[i].pnt],pnts[lines[i].inds[0]],pnts[lines[i].inds[1]],shape.r))
                        }
                    }
                    if (shape.r<0){
                        var [xmin,xmax,ymin,ymax] = pnt_limits(pnts)
                        w = ymax-ymin
                        h = xmax-xmin
                        x = (xmax+xmin)/2
                        y = (ymax+ymin)/2
                    } 
                }                 
                path = JSON.stringify(path)
                var obj = createObj('path',{
                    pageid: page,
                    path: path,
                    stroke: color,
                    layer: 'objects',
                    stroke_width: line_width,
                    height: h,
                    width: w,
                    rotation: R,
                    top: x + T,
                    left: y + L,
                    controlledby: controlled
                })        
                return obj
            case 'path':
                if (shape.r <= 0) {
                    var path = []
                    for (var i in shape.pnts){ path.push(['L',shape.pnts[i].y,shape.pnts[i].x]) }
                } else {
                    var pnts = move_pnts(shape.pos.pnts,shape.pos.dirs,shape.r); var lines = shape.pos.lines
                    var path = [['M',pnts[lines[0].inds[0]].y,pnts[lines[0].inds[0]].x]]
                    for (var i in lines){
                        if (lines[i].type == 'L'){ path.push(['L',pnts[lines[i].inds[1]].y,pnts[lines[i].inds[1]].x]) }
                        else { path.push(...arcs_2_bezier(shape.pnts[lines[i].pnt],pnts[lines[i].inds[0]],pnts[lines[i].inds[1]],shape.r)) }
                    }
                }
                path = JSON.stringify(path)
                var obj = createObj('path',{
                    pageid: page,
                    path: path,
                    stroke: color,
                    layer: 'objects',
                    stroke_width: line_width,
                    height: shape.xmax-shape.xmin,
                    width: shape.ymax-shape.ymin,
                    rotation: R,
                    top: shape.pnt.x + T,
                    left: shape.pnt.y + L,
                    controlledby: controlled
                }) 
                return obj
        }
    }

    var move_shape = function(shape,dir){
        shape.xmin += dir.x; shape.xmax += dir.x;
        shape.ymin += dir.y; shape.ymax += dir.y
        shape.pnt.x += dir.x; shape.pnt.y += dir.y
        if ('pnts' in shape){
            shape.pnts = move_pnts(shape.pnts,dir)
        }
        if ('pos' in shape) {
            shape.pos.pnts = move_pnts(shape.pos.pnts,dir)
        }
        if ('neg' in shape) {
            shape.neg.pnts = move_pnts(shape.neg.pnts,dir)
        }
    }

    var rotate_shape = function(shape,R,pnt) {
        shape.pnt = rotate_pnts([shape.pnts],pnt,R)[0]
        if ('pnts' in shape){
            shape.pnts = rotate_pnts(shape.pnts,pnt,R)
            var [xmin,xmax,ymin,ymax] = pnt_limits(shape.pnts)
            var r = shape.r | 0
            shape.xmin = xmin - r
            shape.xmax = xmax + r
            shape.ymin = ymin - r 
            shape.ymax = ymax + r
        }
        if ('pos' in shape) {
            shape.pos.pnts = rotate_pnts(shape.pos.pnts,pnt,R)
            shape.pos.dirs = rotate_pnts(shape.pos.dirs, Pnt(0,0),R)
        }
        if ('neg' in shape) {
            shape.neg.pnts = rotate_pnts(shape.neg.pnts,pnt,R)
            shape.neg.dirs = rotate_pnts(shape.neg.dirs, Pnt(0,0),R)
        }
    }

    var scale_pnts = function(pnts,loop=true){
        // initialize arrays
        var L = pnts.length
        var start = 0; var end = L
        var pos = {pnts:[], dirs:[], lines:[], circs:[]}
        var neg = {pnts:[], dirs:[], lines:[], circs:[]}
        if (!(loop)){
            start = 1; end = L-1
            var n = inv_pnt(unit( Line(...pnts.slice(0,2))))
            pos.pnts.push(pnts[0]); pos.dirs.push(n); pos.lines.push({type:'L',inds:[0,1]})
            neg.pnts.push(pnts[0]); neg.dirs.push(neg_pnt(n)); neg.lines.push({type:'L',inds:[0,1]})
        }
        // start iterating though points
        for (var j = start; j<end; j++){
            var i = dec(j,L)
            var k = inc(j,L)
            var n1 = inv_pnt(unit(Line(pnts[i],pnts[j])))
            var n2 = inv_pnt(unit(Line(pnts[j],pnts[k])))
            var a = left(pnts[j],{pnt1:pnts[i],pnt2:pnts[k]})
            if (a > 0){
                // positive side
                var l = pos.pnts.length
                pos.pnts.push(pnts[j],pnts[j])
                pos.dirs.push(n1,n2)
                pos.lines.push({type:'A',pnt:j,inds:[l,l+1]},{type:'L',inds:[l+1,l+2]})      
                pos.circs.push(j)
                // negative side
                var l = neg.pnts.length
                var pnta = sub_pnts(pnts[i],n1)
                var pntb = sub_pnts(pnts[j],n1)
                var pntc = sub_pnts(pnts[j],n2)
                var pntd = sub_pnts(pnts[k],n2)
                var pnt = intersect(Line(pnta,pntb),Line(pntc,pntd))
                neg.pnts.push(pnts[j])
                neg.dirs.push(sub_pnts(pnt,pnts[j]))
                neg.lines.push({type:'L',inds:[l,l+1]})
            } else if (a < 0){
                // negative side
                var l = neg.pnts.length
                neg.pnts.push(pnts[j],pnts[j])
                neg.dirs.push(neg_pnt(n1),neg_pnt(n2))
                neg.lines.push({type:'A',pnt:j,inds:[l,l+1]},{type:'L',inds:[l+1,l+2]})
                neg.circs.push(j)     
                // positive side
                var l = pos.pnts.length
                var pnta = add_pnts(pnts[i],n1)
                var pntb = add_pnts(pnts[j],n1)
                var pntc = add_pnts(pnts[j],n2)
                var pntd = add_pnts(pnts[k],n2)
                var pnt = intersect(Line(pnta,pntb),Line(pntc,pntd))
                pos.pnts.push(pnts[j])
                pos.dirs.push(sub_pnts(pnt,pnts[j]))
                pos.lines.push({type:'L',inds:[l,l+1]})
            } 
        }
        // cleanup
        if (loop){
            // correct last index
            pos.lines[pos.lines.length-1].inds[1] = 0
            neg.lines[neg.lines.length-1].inds[1] = 0
            return [pos,neg]
        } else {
            // add endpoints
            var n = inv_pnt(unit(Line(...pnts.slice(-2))))
            pos.pnts.push(pnts[L-1]); pos.dirs.push(n)
            neg.pnts.push(pnts[L-1]); neg.dirs.push(neg_pnt(n))
            // add arc
            var l = pos.pnts.length
            pos.lines.push({type:'A',pnt:L-1,inds:[l-1,l]}); pos.circs.push(L-1)
            // reorder
            l += neg.pnts.length
            for (var i in neg.lines){
                var temp = neg.lines[i].inds[0]
                neg.lines[i].inds[0] = l - 1 - neg.lines[i].inds[1]
                neg.lines[i].inds[1] = l - 1 - temp
            }
            neg.pnts.reverse(); neg.dirs.reverse(); neg.lines.reverse()
            pos.pnts.push(...neg.pnts); pos.dirs.push(...neg.dirs); pos.lines.push(...neg.lines); pos.circs.push(...neg.circs)
            // add arc
            pos.lines.push({type:'A',pnt:0,inds:[l-1,0]}); pos.circs.push(0)
            return pos
        }
    }

    var in_shape = function(pnt,shape,r=0){
        switch (shape.type){
            case 'circle':
                r += shape.r
                if (r<=0) { return false }
                var dx = shape.pnt.x - pnt.x
                var dy = shape.pnt.y - pnt.y
                return (r*r > dx*dx + dy*dy)
            case 'poly':
                if (pnt.x+r<=shape.xmin || pnt.x-r>=shape.xmax || pnt.y+r<=shape.ymin || pnt.y-r>=shape.ymax){ return false }
                if (r==0){
                    return in_poly(pnt,shape)
                } else if (r>0){
                    var temp = move_pnts(shape.pos.pnts,shape.pos.dirs,r)
                    if (wind_num(pnt,{pnts:temp})!=0) { return true }
                    var r2 = r*r
                    for (var c in shape.pos.circs) {
                        var dx = shape.pnts[shape.pos.circs[c]].x - pnt.x
                        var dy = shape.pnts[shape.pos.circs[c]].y - pnt.y
                        if (r2 > dx*dx + dy*dy) { return true } 
                    }
                    return false
                } else if (r<0){
                    var temp = move_pnts(shape.neg.pnts,shape.neg.dirs,-r)
                    var r2 = r*r
                    for (var c in shape.neg.circs) {
                        var dx = shape.pnts[shape.neg.circs[c]].x - pnt.x
                        var dy = shape.pnts[shape.neg.circs[c]].y - pnt.y
                        if (r2 > dx*dx + dy*dy) { return false } 
                    }
                    return wind_num(pnt,{pnts:temp})!=0
                }
            case 'path':
                if (pnt.x+r<=shape.xmin || pnt.x-r>=shape.xmax || pnt.y+r<=shape.ymin || pnt.y-r>=shape.ymax){ return false }
                r += shape.r
                if (r<=0) { return false }
                var temp = move_pnts(shape.pos.pnts,shape.pos.dirs,r)
                if (wind_num(pnt,{pnts:temp})!=0) { return true }
                var r2 = r*r
                for (var c in shape.pos.circs) {
                    var dx = shape.pnts[shape.pos.circs[c]].x - pnt.x
                    var dy = shape.pnts[shape.pos.circs[c]].y - pnt.y
                    if (r2 > dx*dx + dy*dy) { return true } 
                }
                return false
        }
    }

    var arcs_2_bezier = function(c,s,e,r) {
        // split arc into 90 degree incrimenets with values on cartisian edges
        var q1 = quad(c,s)
        var q2 = quad(c,e)
        var pnts = [s]
        while (q1 != q2) {
            if (r > 0) {
                switch(q1){
                    case 1: pnts.push(Pnt(c.x+r,c.y)); break
                    case 2: pnts.push(Pnt(c.x,c.y+r)); break
                    case 3: pnts.push(Pnt(c.x-r,c.y)); break
                    case 4: pnts.push(Pnt(c.x,c.y-r)); break
                }
                q1 = dec(q1-1,4) + 1
            } else {
                switch(q1){
                    case 1: pnts.push(Pnt(c.x,c.y-r)); break
                    case 2: pnts.push(Pnt(c.x+r,c.y)); break
                    case 3: pnts.push(Pnt(c.x,c.y+r)); break
                    case 4: pnts.push(Pnt(c.x-r,c.y)); break
                }
                q1 = inc(q1-1,4) + 1
            }
        }
        pnts.push(e)
        // create bezier pnts
        arcs = []
        for (var p=0; p<pnts.length-1; p++) {
            s = pnts[p]; e = pnts[p+1]
            if (!pnts_eq(s,e)) {
                // k88lawrence via https://stackoverflow.com/questions/734076/how-to-best-approximate-a-geometrical-arc-with-a-bezier-curve
                var ax = s.x - c.x
                var ay = s.y - c.y
                var bx = e.x - c.x
                var by = e.y - c.y
                var q1 = ax * ax + ay * ay
                var q2 = q1 + ax * bx + ay * by
                var k2 = 4/3 * (Math.sqrt(2 * q1 * q2) - q2) / (ax * by - ay * bx)
                var x1 = c.x + ax - k2 * ay
                var y1 = c.y + ay + k2 * ax
                var x2 = c.x + bx + k2 * by                                 
                var y2 = c.y + by - k2 * bx
                // arcs.push(['L',e.y,e.x])
                arcs.push(['C',y1,x1,y2,x2,e.y,e.x])
            }
        }
        return arcs
    }

    var wind_num = function(pnt, poly) {
        var wn = 0
        var q_last = quad(pnt,poly.pnts[poly.pnts.length-1])
        for (var i in poly.pnts){
            var q = quad(pnt,poly.pnts[i])
            var dq = q - q_last
            if (Math.abs(dq)>2){
                dq = -Math.sign(dq)
            } else if (Math.abs(dq)>1) {
                j = dec(i,poly.pnts.length)
                dq = -left(pnt,{pnt1:poly.pnts[i],pnt2:poly.pnts[j]}) * 2
            } else if (q == 0){
                dq = 0
                q = q_last
            }
            wn += dq
            q_last = q
        }
        return Math.abs(wn)
    }
    var quad = function(pnt1,pnt2,check=false) {
        var dx = pnt2.x - pnt1.x
        var dy = pnt2.y - pnt1.y
        ans = {}
        if      (dx>=0 && dy>0){ ans.q = 1 }
        else if (dy>=0 && dx<0){ ans.q = 2 }
        else if (dx<=0 && dy<0){ ans.q = 3 }
        else if (dy<=0 && dx>0){ ans.q = 4 }
        else { ans.q = 0 }
        if (!check) { return ans.q }
        else {
            ans.c = dx==0 || dy==0
            return ans
        }
    }

    var line_sect = function(line1,line2) {
        var p1 = line1.pnt1
        var p2 = line1.pnt2
        var p3 = line2.pnt1
        var p4 = line2.pnt2
        if (Math.min(p1.x,p2.x)>Math.max(p3.x,p4.x) || Math.max(p1.x,p2.x)<Math.min(p3.x,p4.x) ||
            Math.min(p1.y,p2.y)>Math.max(p3.y,p4.y) || Math.max(p1.y,p2.y)<Math.min(p3.y,p4.y) ){
            return false
        } else {
            var dx1 = (p1.x-p2.x)
            var dy1 = (p1.y-p2.y)
            var dx2 = (p3.x-p4.x)
            var dy2 = (p3.y-p4.y)
            var dx3 = (p1.x-p3.x)
            var dy3 = (p1.y-p3.y)
            var d = dx1*dy2 - dy1*dx2
            if (d==0) {return false}
            var t = (dx3*dy2 - dy3*dx2)/d
            var u = (dy1*dx3 - dx1*dy3)/d
            if (t>0 && t<1){
                var u = (dy1*dx3 - dx1*dy3)/d
                if (t>0 && t<1){
                    return t
                }
            }
            return false
        }
    }

    var circle_sect = function(line,circle) {
        var p1 = line.pnt1
        var p2 = line.pnt2
        var p = circle.pnt
        var r = circle.r
        if (p.x+r<=Math.min(p1.x,p2.x) || p.x-r>=Math.max(p1.x,p2.x) || p.y+r<=Math.min(p1.y,p2.y) || p.y-r>=Math.max(p1.y,p2.y)){
            return false
        }
        var dx = p2.x - p1.x
        var dy = p2.y - p1.y
        var dr = dx*dx + dy*dy
        var det = (p1.x-p.x)*(p2.y-p.x) - (p2.x-p.x)*(p1.y-p.y)
        var t = r*r*dr - det*det
        if (t <= 0) { return false }
        pnts = []
        out2in = []
        t = Math.sqrt(t)
        var s = Math.sign(dy) | 1
        var x = (det*dy+s*dx*t)/dr + p.x
        var y = (-det*dx+Math.abs(dy)*t)/dr + p.y
        if (in_line(Pnt(x,y),line)) {
            pnts.push(Pnt(x,y))
            out2in.push(s)
        }
        var x = (det*dy-s*dx*t)/dr + p.x
        var y = (-det*dx-Math.abs(dy)*t)/dr + p.y
        if (in_line(Pnt(x,y),line)) {
            pnts.push(Pnt(x,y))
            out2in.push(-s)
        }
        if (pnts.length == 0) {return false}
        return {pnts:pnts,out2in:out2in}
    }

    var in_line = function(pnt,line) {
        if (pnt.x > Math.min(line.pnt1.x,line.pnt2.x) && pnt.x < Math.max(line.pnt1.x,line.pnt2.x) &&
            pnt.y > Math.min(line.pnt1.y,line.pnt2.y) && pnt.y < Math.max(line.pnt1.y,line.pnt2.y)) {
            return true
        }
        return false
    }

    var intersect = function(line1,line2) {
        var p1 = line1.pnt1
        var p2 = line1.pnt2
        var p3 = line2.pnt1
        var p4 = line2.pnt2
        var dx1 = (p1.x-p2.x)
        var dy1 = (p1.y-p2.y)
        var dx2 = (p3.x-p4.x)
        var dy2 = (p3.y-p4.y)
        var d = dx1*dy2 - dy1*dx2
        var n1 = (p1.x*p2.y-p1.y*p2.x)
        var n2 = (p3.x*p4.y-p3.y*p4.x)
        var x = (n1*dx2 - dx1*n2)/d
        var y = (n1*dy2 - dy1*n2)/d
        return Pnt(x,y)
    }

    var limit_length = function(pnts,length){
        var new_pnts = [pnts[0]]
        var L = 0
        for (var p=1; p<pnts.length; p++){
            var dx = pnts[p].x - pnts[p-1].x
            var dy = pnts[p].y - pnts[p-1].y
            var d = Math.sqrt(dx*dx+dy*dy)
            L += d
            if (L>length){
                new_pnts.push(Pnt(pnts[p].x-(L-length)/d*dx,pnts[p].y-(L-length)/d*dy))
                return new_pnts
            }
            new_pnts.push(pnts[p])
        }
        return new_pnts
    }

    var clockwise = function(pnts){
        var j = 0
        var min = pnts[0]
        for (var i=1; i < pnts.length; i++ ){
            var pnt = pnts[i]
            if (pnt.x <= min.x && pnt.y < min.y){ min = pnt; j = i }
        }
        var i = dec(j,pnts.length)
        var k = inc(j,pnts.length)
        var A = left(pnts[j], Line(pnts[i],pnts[k]))
        if (A<0) { pnts.reverse() }
        return pnts
    }

    var update_r = function(shape,dr){
        shape.r = shape.r + dr
        shape.xmin = shape.xmin - dr
        shape.xmax = shape.xmax + dr
        shape.ymin = shape.ymin - dr
        shape.ymax = shape.ymax + dr
    }

    // ___________________________ Token Functions ________________________________
    var clean_image = function(url,sides=false){
        url = url.replace(/med|max/g,'thumb')
        if (sides) {
            url = url.replace(/:/g,'%3A').replace(/\?/g,'%3F')
        } else {
            url = url.replace(/%3A/g,':').replace(/%3F/g,'?')
        }
        return url
    }

    // ________________________ Combination Functions _____________________________

    var new_handle = function(T,L,R,P,S,player){
        var obj = createObj('graphic',{
            subtype:'token',
            pageid:P,
            imgsrc: _shapes.Invisible,
            left:L,
            top:T,
            width:handle_size*70/S,
            height:handle_size*70/S,
            rotation: R,
            layer: 'objects',
            isdrawing: true,
            controlledby: player.get('id'),
            aura1_radius: 0,
            aura1_color: player.get('color'),
            playersedit_name: false,
            playersedit_bar1: false,
            playersedit_bar2: false,
            playersedit_bar3: false,
            playersedit_aura2: false
        })
        return obj
    }

    var edit_area = function(player,area){

    }

    var whisper = function(as,msg,playerid) {
        var name = getObj('player',playerid).get('displayname')
        sendChat(as,'/w \"'+name+'\" '+msg,null,{noarchive:true})
    }

    // ___________________________ Macro Functions ________________________________

    var test = function(args,playerid,selected) {
        // log(args)
        for (var i in selected){
            var obj = getObj(selected[i]._type,selected[i]._id)
            log(obj)
            if (obj.get('type')=='graphic'){
                var obj_new = createObj('graphic',{
                    // sides: clean_image(obj.get('imgsrc'),true),
                    pageid: obj.get('pageid'),
                    imgsrc: _shapes.Invisible,
                    top: obj.get('top'),
                    left: obj.get('left'),
                    width: obj.get('width'),
                    height: obj.get('height'),
                    layer: obj.get('layer'),
                })
                obj_new.set({
                    imgsrc: clean_image(obj.get('imgsrc')),
                    // sides: '',
                })
            }

        }
    }

    var create_area = function(args,id,sel){
        switch(args[0]){
            case 'Circle':
                if (!(sel)){ return }  
                if (sel[0]._type=='path' || sel[0]._type=='graphic'){
                    var obj = getObj(sel[0]._type,sel[0]._id)
                    var player = getObj('player',id)
                    var color = player.get('color')
                    var P = obj.get('pageid')
                    var S = getObj('page',P).get('scale_number')
                    var R = obj.get('rotation')
                    var s = Math.max(obj.get('height'),obj.get('width'))/2
                    var cos = Math.cos(R*Math.PI/180)
                    var sin = Math.sin(R*Math.PI/180)
                    var T = obj.get('top') - s*cos
                    var L = obj.get('left') + s*sin
                    var r = safeFloat(args[1]) * 70 / S
                    if (r > 0){
                        var shape = Shape('circle',Circle(Pnt(T,L),r))
                        var path = shape_2_path(shape,P,color,player.get('id'))
                    }
                }
                break
            case 'Rectangle':
                if (!(sel)){ return }  
                if (sel[0]._type=='path' || sel[0]._type=='graphic'){
                    var obj = getObj(sel[0]._type,sel[0]._id)
                    var player = getObj('player',id)
                    var color = player.get('color')
                    var P = obj.get('pageid')
                    var S = getObj('page',P).get('scale_number')
                    var R = obj.get('rotation')
                    var s = Math.max(obj.get('height'),obj.get('width'))/2
                    var cos = Math.cos(R*Math.PI/180)
                    var sin = Math.sin(R*Math.PI/180)
                    var T = obj.get('top') - s*cos
                    var L = obj.get('left') + s*sin
                    var l = safeFloat(args[1]) * 70 / S
                    var w = safeFloat(args[2]) * 70 / S
                    if (w<=0) { w=l }
                    if (l<=0) { l=w }
                    if (w>0 && l>0){
                        var shape = Shape('poly',Poly([Pnt(T,L-w/2),Pnt(T-l,L-w/2),Pnt(T-l,L+w/2),Pnt(T,L+w/2)]))
                        var path = shape_2_path(shape,P,color,player.get('id'),R,(l/2)*(1-cos),(l/2)*sin)
                        rotate_shape(shape,R,Pnt(T,L))
                    }
                }
                break
            case 'Triangle':
                if (!(sel)){ return } 
                if (sel[0]._type=='path' || sel[0]._type=='graphic'){ 
                    var obj = getObj(sel[0]._type,sel[0]._id)
                    var player = getObj('player',id)
                    var color = player.get('color')
                    var P = obj.get('pageid')
                    var S = getObj('page',P).get('scale_number')
                    var R = obj.get('rotation')
                    var s = Math.max(obj.get('height'),obj.get('width'))/2
                    var cos = Math.cos(R*Math.PI/180)
                    var sin = Math.sin(R*Math.PI/180)
                    var T = obj.get('top') - s*cos
                    var L = obj.get('left') + s*sin
                    var l = safeFloat(args[1]) * 70 / S
                    var w = l
                    if (w>0 && l>0){
                        var shape = Shape('poly',Poly([Pnt(T,L),Pnt(T-l,L-w/2),Pnt(T-l,L+w/2)]))
                        var path = shape_2_path(shape,P,color,player.get('id'),R,(l/2)*(1-cos),(l/2)*sin)
                        rotate_shape(shape,R,Pnt(T,L))
                    }
                }
                break
            case 'Wall':
                for (var i in sel){
                    if (sel[i]._type != 'path') { continue }
                    var obj = getObj('path',sel[i]._id)
                    var player = getObj('player',id)
                    var color = player.get('color')
                    var P = obj.get('pageid')
                    var S = getObj('page',P).get('scale_number')
                    var r = safeFloat(args[1]) * 70 / S / 2
                    var l = safeFloat(args[2]) * 70 / S
                    if (l<=0) { l = Infinity }
                    if (r>=0){
                        color = obj.get('stroke')
                        id = obj.get('controlledby')
                        var shape = path_2_shape(obj,l)
                        if (shape.type == 'circle' || shape.type == 'poly') {
                            var shape_in = copy(shape)
                            update_r(shape,r)
                            var path = shape_2_path(shape,P,color,id)
                            update_r(shape_in,-r)
                            var path_in = shape_2_path(shape_in,P,color,id)
                        } else {
                            update_r(shape,r)
                            var path = shape_2_path(shape,P,color,id)
                        }
                        obj.remove()
                    }
                }
                break
        }
    }

    var add_side = function(args,player,selected) {

        var obj_main = getObj('graphic',args[0])
        var obj_img = getObj('graphic',args[1])

        var sides = ''
        if (obj_main.get('sides')) { sides = obj_main.get('sides')}
        else { sides = obj_main.get('imgsrc') }
        if (obj_img.get('sides')) { sides += '|'+obj_img.get('sides')}
        else { sides += '|' + obj_img.get('imgsrc') }

        sides = clean_image(sides,true)

        obj_main.set({sides:sides})
        obj_img.remove()
    }

    var set_size = function(args,id,sel){
        for (var i in sel){
            var obj = getObj(sel[i]._type,sel[i]._id)
            var P = obj.get('pageid')
            var S = getObj('page',P).get('scale_number')
            var H = safeFloat(args[0]) * 70 / S
            var W = safeFloat(args[1]) * 70 / S
            var T = obj.get('type')
            if (T=='graphic'){
                if (W <= 0) { 
                    W = obj.get('width')*H/obj.get('height')
                    if (W<=0) {return null}
                }
                if (H <= 0) {
                    H = obj.get('height')*W/obj.get('width')
                    if (H<=0) {return null}
                }
                obj.set({height:H,width:W})
            } else if (T=='path'){
                var sY = H/obj.get('height')
                var sX = W/obj.get('width')
                if (sY <= 0 ) {
                    sY = sX
                    if (sY <= 0 ) { sY = 1 }
                }
                if (sX <= 0 ) {
                    sX = sY
                    if (sX <= 0 ) { sX = 1 }
                }
                obj.set({scaleX:sX,scaleY:sY})
            }
        }
    }

    var add_area = function(args,player,selected){
        _shapes[args[1]] = clean_image(getObj('graphic',args[0]).get('imgsrc'))
        str = 'Shapes:\n'
        for (var shape in _shapes){
            str += '   '+shape+': '+_shapes[shape]+'\n'
        }
        log(str)
    }

    // Macros
    var macros = {}
    // Player Macros
    macros['Area'] = {fun:create_area,vis:'all',ta:true,txt:'?{Select Shape|Circle,Circle ?{Radius}|Rectangle,Rectangle ?{Length} ?{Width}|Triangle,Triangle ?{Length}|Wall,Wall ?{Width} ?{Max Length}}'}
    // GM Macros
    macros['_Size'] = {fun:set_size,vis:'GM',ta:false,txt:'?{Height} ?{Width}'}
    macros['_Add_Side'] = {fun:add_side,vis:'GM',ta:false,txt:'@{target|Token|token_id} @{target|Image to Add|token_id}'}
    macros['_Test'] = {fun:test,vis:'GM',txt:'',ta:true}
    // macros['_Add_Area'] = {fun:add_area,vis:'GM',ta:false,txt:'@{target|Select Shape|token_id} ?{Shape|Invisible|Circle|Rectangle|Triangle|Hexagon|Custom,?{Shape Name}}'}


    // ___________________________ Event Functions ________________________________

    var ready = function(){
        on('ready',function(){    
            // create macros
            if (refresh){
                add_macros()
            }
            log('API Ready')
            // sendChat('AdvTkn','/w gm API Ready',null,{noarchive:true})
        })
    }

    if (!refresh) {
        ready()
    }

    // on('change:graphic', function(obj,prev){
    //     // save then hide path
    //     var id = obj.get('id')
        
    //     if (id in _refs){
    //         var area = _areas[_refs[id]]
    //     }
  
    // })

    // on('change:path', function(obj,prev){
        
    // })


    on('chat:message', function(msg) {
        if (msg.type=='api') {
            if (msg.content.startsWith('!'+mask+' ')) {
                var data = msg.content.split(' ')
                var macro = macros[data[1]]
                macro.fun(data.slice(2),msg.playerid,msg.selected)
            }
        }
    })  

    if (refresh) {
        ready()
    }



})()

