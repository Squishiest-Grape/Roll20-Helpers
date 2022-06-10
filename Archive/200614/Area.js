// __________________________ Initialize _______________________________________
const ipx = 'https://s3.amazonaws.com/files.d20.io/images/129234422/z67Jv24VGn2L0IDaWpd4gw/thumb.png?15882542305'


delete state['Area']

if (!(state.Area)){
    state.Area = {}
    state.Area.Areas = {}
    state.Area.Refs = {}
    state.Area.settings = {}
    state.Area.settings.handle_size = 2
    state.Area.settings.line_width = 5
}


// ___________________________ Interface _______________________________________

if (!(state.Macros)) { state.Macros = {} }

state.Macros['Area'] = {fun:create_area,vis:'all',txt:
    '?{Select Shape|'+
        'Circle,Circle ?{Radius}|'+
        'Rectangle,Rectangle ?{Length} ?{Width}|'+
        'Triangle,Triangle ?{Length}|'+
        'Wall,Wall ?{Width} ?{Max Lenght}'+'}'
    }
    
state.Macros['Size'] = {fun:set_size,vis:'GM',txt:
    '?{Height} ?{Width}'
    } 
    

// __________________________ General Classes __________________________________

class Pnt       { constructor(x,y)      { this.x = x; this.y = y                } }
class Line      { constructor(pnt1,pnt2){ this.pnt1 = pnt1; this.pnt2 = pnt2    } }
class Circle    { constructor(pnt,r)    { this.pnt = pnt; this.r = r            } }
class Poly      { constructor(pnts)     { this.pnts = pnts                      } }
class Path      { constructor(pnts,r=0) { this.pnts = pnts; this.r = r          } }

class Shape {
    constructor(type,data){
        this.type = type
        for (var param in data){
            this[param] = data [param]
        }
        switch (type) {
            case 'circle':
                this.xmin = data.pnt.x - data.r
                this.xmax = data.pnt.x + data.r
                this.ymin = data.pnt.y - data.r
                this.ymax = data.pnt.y + data.r
                break
            case 'poly':
                var pnts = data.pnts
                var [xmin,xmax,ymin,ymax] = pnt_limits(pnts)
                this.xmin = xmin
                this.xmax = xmax
                this.ymin = ymin
                this.ymax = ymax
                this.pnt = new Pnt((xmax+xmin)/2,(ymax+ymin)/2)
                this.pnts = clockwise(pnts)
                var data = scale_pnts(this.pnts)
                this.pos = data[0]; this.neg = data[1]
                break
            case 'path':
                var pnts = data.pnts
                var [xmin,xmax,ymin,ymax] = pnt_limits(pnts)
                this.xmin = xmin - data.r
                this.xmax = xmax + data.r
                this.ymin = ymin - data.r
                this.ymax = ymax + data.r
                this.pnt = new Pnt((xmax+xmin)/2,(ymax+ymin)/2)
                this.pos = scale_pnts(this.pnts,false)
                break
        }
    }
}

class Area {
    constructor(path,shape,handle){
        this.path = path
        this.shape = shape
        this.handle = handle
        this.stats = []
    }
}

// __________________________ Utility Functions ________________________________

function dec(i,l){
    i = parseInt(i)
    if (i > 0) { return (i - 1)|0 } 
    else { return (l - 1 - i)|0 }
}

function inc(i,l){
    i = parseInt(i)
    if (i < l-1) { return (i + 1)|0 } 
    else { return (i - l + 1)|0 }
}

function safeFloat(val){
    parseFloat(val)
    if (!(val)) { val == 0 }
    return val
}

// __________________________ Vector Functions ________________________________

function add_pnts(pnt1,pnt2){return new Pnt(pnt1.x+pnt2.x,pnt1.y+pnt2.y)}
function sub_pnts(pnt1,pnt2){return new Pnt(pnt1.x-pnt2.x,pnt1.y-pnt2.y)}
function inv_pnt(pnt){return new Pnt(-pnt.y,pnt.x)}
function neg_pnt(pnt){return new Pnt(-pnt.x,-pnt.y)}

function left(pnt,line){
    return Math.sign( (line.pnt2.x-pnt.x)*(line.pnt1.y-pnt.y) - (line.pnt1.x-pnt.x)*(line.pnt2.y-pnt.y) )
}

function rotate_pnts(pnts,ref,R){
    var new_pnts = []
    var sin = Math.sin(R*Math.PI/180)
    var cos = Math.cos(R*Math.PI/180)
    for (var p in pnts){
        var dx = pnts[p].x - ref.x
        var dy = pnts[p].y - ref.y
        var x = ref.x + (dx*cos - dy*sin)
        var y = ref.y + (dy*cos + dx*sin)
        new_pnts.push(new Pnt(x,y))
    }
    return new_pnts
}

function normal(line){
    var dx = line.pnt2.x - line.pnt1.x
    var dy = line.pnt2.y - line.pnt1.y
    var d = Math.sqrt(dx*dx+dy*dy)
    if (d==0){
        return new Pnt(0,0)
    } else {
        return new Pnt(dx/d,dy/d)
    }
}

function move_pnts(pnts,dirs,scale=1){
    var ans = []
    if (Array.isArray(dirs)){
        for (var p in pnts){ ans.push(new Pnt(pnts[p].x+dirs[p].x*scale,pnts[p].y+dirs[p].y*scale)) }
    } else {
        for (var p in pnts){ ans.push(new Pnt(pnts[p].x+dirs.x*scale,pnts[p].y+dirs.y*scale)) }
    }
    return ans
}

function pnt_limits(pnts){
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

function arcs_2_bezier(c,s,e,r){
    var arcs = []
    var a1 = Math.atan2(s.y-c.y,s.x-c.x)
    var a2 = Math.atan2(e.y-c.y,e.x-c.x)
    var a = a2 - a1
    if (a > Math.PI) { a -= 2*Math.Pi }
    else if (a < -Math.PI) { a += 2*Math.Pi }
    if (Math.abs(a) <= Math.PI/2) {
        arcs.push([c,s,e])
    } else {
        a = (a2+a1)/2
        var m = new Pnt(r*Math.cos(a)+c.x,r*Math.sin(a)+c.y)
        arcs.push([c,s,m],[c,m,e])
    }
    for (a in arcs){
        c = arcs[a][0]; s = arcs[a][1]; e = arcs[a][2]
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
        arcs[a] = ['C',y1,x1,y2,x2,e.y,e.x]
    }
    return arcs
}

function wind_num(pnt, poly){
    var wn = 0
    var q_last = quad(pnt,poly.pnts[poly.pnts.length-1])
    for (var i in poly.pnts){
        var q = quad(pnt,poly.pnts[i])
        var dq = q - q_last
        if (Math.abs(dq)>2){
            dq = -Math.sign(dq)
        } else if (Math.abs(dq)>1) {
            j = dec(i,poly.pnts.length)
            dq = left(pnt,{pnt1:poly.pnts[i],pnt2:poly.pnts[j]}) * 2
        } else if (q == 0){
            dq = 0
            q = q_last
        }
        wn += dq
        q_last = q
    }
    return Math.abs(wn)
}
function quad(pnt1,pnt2){
    var dx = pnt2.x - pnt1.x
    var dy = pnt2.y - pnt1.y
    if (dx>0){
        if (dy>0){ return 1 }
        else if (dy<0) { return 4 }
        else { return 0 }
    } else if (dx<0) {
        if (dy>0){ return 2 }
        else if (dy<0){ return 3 }
        else { return 0 }
    } else { return 0 }
}

function line_sect(line1,line2){
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

function circle_sect(line,circle){
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
    if (in_line(new Pnt(x,y),line)) {
        pnts.push(new Pnt(x,y))
        out2in.push(s)
    }
    var x = (det*dy-s*dx*t)/dr + p.x
    var y = (-det*dx-Math.abs(dy)*t)/dr + p.y
    if (in_line(new Pnt(x,y),line)) {
        pnts.push(new Pnt(x,y))
        out2in.push(-s)
    }
    if (pnts.length == 0) {return false}
    return {pnts:pnts,out2in:out2in}
}

function in_line(pnt,line){
    if (pnt.x > Math.min(line.pnt1.x,line.pnt2.x) && pnt.x < Math.max(line.pnt1.x,line.pnt2.x) &&
        pnt.y > Math.min(line.pnt1.y,line.pnt2.y) && pnt.y < Math.max(line.pnt1.y,line.pnt2.y)) {
        return true
    }
    return false
}

function intersect(line1,line2){
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
    return new Pnt(x,y)
}

function limit_length(pnts,length){
    var new_pnts = [pnts[0]]
    var L = 0
    for (var p=1; p<pnts.length; p++){
        var dx = pnts[p].x - pnts[p-1].x
        var dy = pnts[p].y - pnts[p-1].y
        var d = Math.sqrt(dx*dx+dy*dy)
        L += d
        if (L>length){
            new_pnts.push(new Pnt(pnts[p].x-(L-length)/d*dx,pnts[p].y-(L-length)/d*dy))
            return new_pnts
        }
        new_pnts.push(pnts[p])
    }
    return new_pnts
}

function clockwise(pnts){
    var j = 0
    var min = pnts[0]
    for (var i=1; i < pnts.length; i++ ){
        var pnt = pnts[i]
        if (pnt.x <= min.x && pnt.y < min.y){ min = pnt; j = i }
    }
    var i = dec(j,pnts.length)
    var k = inc(j,pnts.length)
    var A = left(pnts[j],new Line(pnts[i],pnts[k]))
    if (A<0) { pnts.reverse() }
    return pnts
}

// ____________________________ Main Functions ________________________________

function create_area(args,id,sel){
    if (!(sel)){ return }  
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
    switch(args[0]){
        case 'Circle':
            var r = safeFloat(args[1]) * 70 / S
            var shape = new Shape('circle',new Circle(new Pnt(T,L),r))
            var path = shape_2_path(shape,P,color,player.get('id')).get('id')
            // var handle = new_handle(T,L,R,P,S,player)
            // state.Area.Areas[path] = new Area(path,shape,handle)
            break
        case 'Rectangle':
            var l = safeFloat(args[1]) * 70 / S
            var w = safeFloat(args[2]) * 70 / S
            var shape = new Shape('poly',new Poly([new Pnt(T,L-w/2), new Pnt(T-l,L-w/2), new Pnt(T-l,L+w/2), new Pnt(T,L+w/2)]))
            var path = shape_2_path(shape,P,color,player.get('id'),0,R,-(l/2)*sin,(l/2)*cos).get('id')
            rotate_shape(shape,R,new Pnt(T,L))
            // var handle = new_handle(T,L,R,P,S,player)
            // state.Area.Areas[path] = new Area(path,shape,handle)
            break
        case 'Triangle':
            var l = safeFloat(args[1]) * 70 / S
            var w = l
            var shape = new Shape('poly',new Poly([new Pnt(T,L), new Pnt(T-l,L-w/2), new Pnt(T-l,L+w/2)]))
            var path = shape_2_path(shape,P,color,player.get('id'),0,R,-(l/2)*sin,(l/2)*cos).get('id')
            rotate_shape(shape,R,new Pnt(T,L))
            // var handle = new_handle(T,L,R,P,S,player)
            // state.Area.Areas[path] = new Area(path,shape,handle)
            break
        case 'Wall':
            var r = safeFloat(args[1]) * 70 / S
            var l = safeFloat(args[2]) * 70 / S
            if (l==0) { l = Infinity }
            color = obj.get('stroke')
            id = obj.get('controlledby')
            var shape = path_2_shape(obj,r,l)
            var path = shape_2_path(shape,P,color,id).get('id')
            // state.Area.Areas[path] = new Area(path,shape)
            break
    }
}

function set_size(args,id,sel){
    for (var i in sel){
        var obj = getObj(sel[i]._type,sel[i]._id)
        var P = obj.get('pageid')
        var S = getObj('page',P).get('scale_number')
        var H = safeFloat(args[0]) * 70 / S
        var W = safeFloat(args[1]) * 70 / S
        var T = obj.get('type')
        if (T=='graphic'){
            if (W <= 0) { W = obj.get('width')*H/obj.get('height') }
            if (H <= 0) { H = obj.get('height')*W/obj.get('width') }
            obj.set({height:H,width:W})
        } else if (T=='path'){
            var sY = H/obj.get('height')
            if (sY <= 0 ) { sY = 1 }
            var sX = W/obj.get('width')
            if (sX <= 0 ) { sX = 1 }
            obj.set({scaleX:sX,scaleY:sY})
        }
    }
}

function new_handle(T,L,R,P,S,player){
    var obj = createObj('graphic',{
        subtype:'token',
        pageid:P,
        imgsrc:ipx,
        left:L,
        top:T,
        width:state.Area.settings.handle_size*70/S,
        height:state.Area.settings.handle_size*70/S,
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

function path_2_shape(obj,r=undefined,length=undefined){
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
        var r = (h*sY + w*sX)/2
        return new Shape('circle',new Circle(new Pnt(T,L),r))
    }
    // generate points for poly and path
    var pnts = []
    var sin = Math.sin(R*Math.PI/180)
    var cos = Math.cos(R*Math.PI/180)
    for (p in path){
        var t = (path[p][2] - h/2)*sY
        var l = (path[p][1] - w/2)*sX
        var t_p = T + (t*cos - l*sin)
        var l_p = L + (t*sin + l*cos)
        pnts.push(new Pnt(t_p,l_p)) 
    }
    if (length) { pnts = limit_length(pnts,length) }
    // check if polygon
    if (r==undefined && pnts[0]==pnts[pnts.length-1]){
        return new Shape('poly',new Poly(pnts.slice(0,-1)))
    // return path
    } else {
        var r0 = r|0
        return new Shape('path',new Path(pnts,r0))
    }
}

function shape_2_path(shape,page,color,controlled,r0=0,R=0,T=0,L=0){
    var r = r0; if (shape.r){ r += shape.r }
    if (shape.type=='circle'){
        var path = []
        const d = (1-Math.tan(Math.PI/8)*4/3)
        const circ_path_ref = [0,1,0,d,d,0,1,0,2-d,0,2,d,2,1,2,2-d,2-d,2,1,2,d,2,0,2-d,0,1]
        for (var i in circ_path_ref){ path.push(circ_path_ref[i]*r) }
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
            stroke_width: state.Area.settings.line_width,
            width: 2*r,
            height: 2*r,
            rotation: R,
            top: shape.pnt.x+T,
            left: shape.pnt.y+L,
            controlledby: controlled
        })
        return obj
    } else {
        if (r==0) {
            var path = []
            for (var i in shape.pnts){
                path.push(['L',shape.pnts[i].y-shape.ymin,shape.pnts[i].x-shape.xmin]) 
            }
            if (shape.type=='poly') { path.push(['L',path[0][1],path[0][2]]) }
            path[0][0] = 'M'
            path = JSON.stringify(path)
            var obj = createObj('path',{
                pageid: page,
                path: path,
                stroke: color,
                layer: 'objects',
                stroke_width: state.Area.settings.line_width,
                height: shape.xmax-shape.xmin,
                width: shape.ymax-shape.ymin,
                rotation: R,
                top: (shape.xmax+shape.xmin)/2+T,
                left: (shape.ymax+shape.ymin)/2+L,
                controlledby: controlled
            })
            return obj
        } else { 
            var pnts; var lines
            if (r>0){
                pnts = move_pnts(shape.pos.pnts,shape.pos.dirs,r)
                lines = shape.pos.lines
            } else {
                if (shape.type=='path') { return false }
                pnts = move_pnts(shape.neg.pnts,shape.neg.dirs,Math.abs(r))
                lines = shape.neg.lines
            }
            var path = [['M',pnts[lines[0].inds[0]].y,pnts[lines[0].inds[0]].x]]
            for (var i in lines){
                if (lines[i].type == 'L'){
                    path.push(['L',pnts[lines[i].inds[1]].y,pnts[lines[i].inds[1]].x])
                } else if (lines[i].type == 'A'){
                    //path.push(...arcs_2_bezier(shape.pnts[lines[i].pnt],pnts[lines[i].inds[0]],pnts[lines[i].inds[1]],r))
                    path.push(['L',pnts[lines[i].inds[1]].y,pnts[lines[i].inds[1]].x])
                }
            }
            path = JSON.stringify(path)
            var obj = createObj('path',{
                pageid: page,
                path: path,
                stroke: color,
                layer: 'objects',
                stroke_width: state.Area.settings.line_width,
                height: (shape.xmax-shape.xmin) + r0,
                width: (shape.ymax-shape.ymin) + r0,
                rotation: R,
                top: (shape.xmax+shape.xmin)/2+T,
                left: (shape.ymax+shape.ymin)/2+L,
                controlledby: controlled
            })
            return obj
        }
    }
}

function move_shape(shape,dir){
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

function rotate_shape(shape,R,pnt){
    shape.pnt = rotate_pnts([shape.pnts],pnt,R)[0]
    if ('pnts' in shape){
        shape.pnts = rotate_pnts(shape.pnts,pnt,R)
        var [xmin,xmax,ymin,ymax] = pnt_limits(shape.pnts)
        var r = shape.r | 0
        this.xmin = xmin - r
        this.xmax = xmax + r
        this.ymin = ymin - r 
        this.ymax = ymax + r
    }
    if ('pos' in shape) {
        shape.pos.pnts = rotate_pnts(shape.pos.pnts,pnt,R)
        shape.pos.dirs = rotate_pnts(shape.pos.dirs,new Pnt(0,0),R)
    }
    if ('neg' in shape) {
        shape.neg.pnts = rotate_pnts(shape.neg.pnts,pnt,R)
        shape.neg.dirs = rotate_pnts(shape.neg.dirs,new Pnt(0,0),R)
    }
}

function scale_pnts(pnts,loop=true){
    // initialize arrays
    var L = pnts.length
    var start = 0; var end = L
    var pos = {pnts:[], dirs:[], lines:[], circs:[]}
    var neg = {pnts:[], dirs:[], lines:[], circs:[]}
    if (!(loop)){
        start = 1; end = L-1
        var n = inv_pnt(normal(new Line(...pnts.slice(0,2))))
        pos.pnts.push(pnts[0]); pos.dirs.push(n); pos.lines.push({type:'L',inds:[0,1]})
        neg.pnts.push(pnts[0]); neg.dirs.push(neg_pnt(n)); neg.lines.push({type:'L',inds:[0,1]})
    }
    // start iterating though points
    for (var j = start; j<end; j++){
        var i = dec(j,L)
        var k = inc(j,L)
        var n1 = inv_pnt(normal(new Line(pnts[i],pnts[j])))
        var n2 = inv_pnt(normal(new Line(pnts[j],pnts[k])))
        var a = left(pnts[j],{pnt1:pnts[i],pnt2:pnts[k]})
        if (a < 0){
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
            var pnt = intersect(new Line(pnta,pntb),new Line(pntc,pntd))
            neg.pnts.push(pnts[j])
            neg.dirs.push(sub_pnts(pnt,pnts[j]))
            neg.lines.push({type:'L',inds:[l,l+1]})
        } else if (a > 0){
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
            var pnt = intersect(new Line(pnta,pntb),new Line(pntc,pntd))
            pos.pnts.push(pnts[j])
            pos.dirs.push(sub_pnts(pnt,pnts[j]))
            pos.lines.push({type:'L',inds:[l,l+1]})
        } 
    }
    // cleanup
    if (loop){
        // correct last index
        pos.lines[pos.lines.length-1][1] = 0
        neg.lines[neg.lines.length-1][1] = 0
        return [pos,neg]
    } else {
        // add endpoints
        var n = inv_pnt(normal(new Line(...pnts.slice(-2))))
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
        log(pos.lines)
        return pos
    }
}

function in_shape(pnt,shape,r=0){
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


function edit_area(obj){
    
}

