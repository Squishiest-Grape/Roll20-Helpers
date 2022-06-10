// path for eye token (you will need to add a token, copy it then type !T while selected to get the adress)
var eye_img = 'https://s3.amazonaws.com/files.d20.io/images/129196454/EFKM0tFiTVG2MsSK7Wt_oQ/thumb.png?158824171755'

// paths for the shadows, eyes, and cage
const octogon =    [[ 24.74873734, 24.74873734,1],[35, 0,1], 
                    [ 24.74873734,-24.74873734,1],[0,-35,1], 
                    [-24.74873734,-24.74873734,1],[-35,0,1], 
                    [-24.74873734, 24.74873734,1],[0, 35,1]  ]
const octogon_E  = [[ 12.9046987567, 31.1546987567,1],[ 31.1546987567, 12.9046987567,1], 
                    [ 31.1546987567,-12.9046987567,1],[ 12.9046987567,-31.1546987567,1], 
                    [-12.9046987567,-31.1546987567,1],[-31.1546987567,-12.9046987567,1], 
                    [-31.1546987567, 12.9046987567,1],[-12.9046987567, 31.1546987567,1]  ]
const cage_p = JSON.stringify([['M',0,0],['L',0,2],['L',2,2],['L',2,0],['L',0,0]])
// default and limits of shadow size
def_scale = 0.6/70
min_scale = 0.2/70
max_scale = 1.0/70


// Test script (currently logs image url)
on('chat:message', function(msg) {
    if (msg.type=='api' && msg.content == '!T'){
        var objs = msg.selected
        var obj = getObj('graphic',objs[0]._id)
        log(obj.get('imgsrc'))
    }
})


// lock and unlock functions
// type !lock or !unlock while tokens are selected
on('chat:message', function(msg) {
    if (msg.type=='api' && ['!lock','!unlock'].includes(msg.content)){
        var dir = msg.content.substr(1)
        var objs = msg.selected
        if (objs) {
            for (i=0; i<objs.length; i++) {
                if (objs[i]._type=='graphic') {
                    var obj = getObj('graphic',objs[i]._id)
                    if (obj.get('subtype')=='token'){
                        if (dir=='lock') { lock(obj) }
                        if (dir=='unlock') { unlock(obj) }
                    }
                }
            }
            sendChat('Test','Done.')
        } else {
            sendChat('Test','Nothing Selected')
        }
    }
})


// variable to store locked tokens
var locked = {}

// trash cleaning
on('destroy:token',function(obj){
    if (obj.get('id') in locked) {
        unlock(obj)
    }
})

// lock function
function lock(obj){
    id = obj.get('id')
    if (id in locked) {
        sendChat('Locker','Already Locked')
    } else {
        locked[id] = createBody(obj)
        sendChat('Locker','Locked')
    }
}

// unlock function
function unlock(obj){
    id = obj.get('id')
    if (id in locked){
        deleteBody(id)
        sendChat('Locker','Unlocked')
    } else {
        sendChat('Locker','Already Unlocked')
    }
}

// create cell, body and eyes
function createBody(obj) {
    // array to store ids of all parts
    ids = {}
    // create cage to prevent token moving
    var cage = createObj('path',{
            pageid: obj.get('pageid'),
            left: obj.get('left'),
            top: obj.get('top'),
            layer: 'walls',
            path: cage_p,
            height: 2,
            width: 2,
            stroke: '#8764ad',
            stroke_width: 1
        })
    ids['cage'] = cage.get('id')
    // get parameters to create body
    var scale = getObj('page',obj.get('pageid')).get('scale_number')
    var L = getAttrByName(obj.get('represents'),'length')/scale | obj.get('height')*def_scale
    L = Math.min(Math.max(L,obj.get('height')*min_scale),obj.get('height')*max_scale)
    var W = getAttrByName(obj.get('represents'),'width')/scale  | obj.get('width')*def_scale
    W = Math.min(Math.max(W,obj.get('width')*min_scale),obj.get('width')*max_scale)
    // solve for body points
    var cos = Math.cos(obj.get('rotation')*Math.PI/180)
    var sin = Math.sin(obj.get('rotation')*Math.PI/180)
    var M = [[W*cos,W*sin,0],[-L*sin,L*cos,0],[35*W,35*L,1]] 
    var P = MatrixMath.multiply(M,octogon)
    var path = [['M',P[7][0],P[7][1]]]
    for (i=0;i<8;i++){
        path.push(['L',P[i][0],P[i][1]])
    }
    // creat body path
    body = createObj('path',{
        pageid: obj.get('pageid'),
        left: obj.get('left'),
        top: obj.get('top'),
        layer: 'walls',
        path: JSON.stringify(path),
        height: 70*L,
        width: 70*W,
        rotation: obj.get('rotation'),
        stroke: '#8764ad',
        stroke_width: 5
    })    
    ids['body'] = body.get('id')
    // solve for eye points
    ids['eyes'] = []
    M[2][0] = obj.get('left')
    M[2][1] = obj.get('top')
    var P = MatrixMath.multiply(M,octogon_E)
    // create eyes
    for (i=0;i<8;i++){
        ids['eyes'].push(createEye(obj,P[i][0],P[i][1]))
    }
    // move token to top
    toFront(obj)
    return ids
}

// create a viewing eye token
function createEye(obj,left,top){
    var eye = createObj('graphic',{
            subtype:                    'token',
            pageid:                     obj.get('pageid'),
            layer:                      'objects',
            represents:                 obj.get('represents'),
            left:                       left,
            top:                        top,
            imgsrc:                     eye_img,
            width:                      0,
            height:                     0,
            rotation:                   obj.get('rotation'),
            light_radius:               obj.get('light_radius'),
            light_dimradius:            obj.get('light_dimradius'),
            light_otherplayers:         obj.get('light_otherplayers'),
            light_hassight:             obj.get('light_hassight'),
            light_angle:                obj.get('light_angle'),
            light_losangle:             obj.get('light_losangle'),
            light_multiplier:           obj.get('light_multiplier')
        })
    return eye.get('id')
}

// delete all body parts
function deleteBody(id){
    safeDelete('path',locked[id]['cage'])
    safeDelete('path',locked[id]['body'])
    for (i=0;i<locked[id]['eyes'].length;i++){
        safeDelete('graphic',locked[id]['eyes'][i])
    }
    delete locked[id]
}

// safe delete in case of early deletion
function safeDelete(type,id){
    obj = getObj(type,id)
    if (typeof obj == 'object') {
        obj.remove()
    }
}
