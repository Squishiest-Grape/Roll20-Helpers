/* TO DO
-update code to allow combat vision changes?




*/ 


// default parameters
var allow_rotation = true
var hard_freeze = false

// transparent pixel refrences
const ipx = 'https://s3.amazonaws.com/files.d20.io/images/129234422/z67Jv24VGn2L0IDaWpd4gw/thumb.png?15882542305'

// saved variable
frozen = {}
shadows = {}

// test script
on('chat:message', function(msg) {
    if (msg.type=='api' && msg.content == '!T'){
        var objs = msg.selected
        var obj = getObj(objs[0]._type,objs[0]._id)
        log(obj.get('imgsrc'))
    }
})

// chat hendler
on('chat:message', function(msg) {
    if (msg.type=='api' && msg.content == '!freeze'){
        var objs = msg.selected
        for (i=0;i<objs.length;i++){
            var obj = getObj(objs[i]._type,objs[i]._id)
            freeze(obj)
        }
    }
})

// freeze function
function freeze(obj){
    if (obj.get('type')=='graphic' && obj.get('subtype')=='token'){
        if (obj.get('id') in frozen) {
            unfreeze(obj)
        } else {
            var L = obj.get('left')
            var T = obj.get('top')
            var R = obj.get('rotation')
            // create shadow
            var shadow = createObj('graphic',{
                subtype:            'token',
                pageid:             obj.get('pageid'),
                imgsrc:             ipx,
                represents:         obj.get('represents'),
                left:               L,
                top:                T,
                width:              obj.get('width'),
                height:             obj.get('height'),
                rotation:           R,
                layer:              'objects',
                isdrawing:          'true',
                controlledby:       obj.get('controlledby'),
                light_radius:       obj.get('light_radius'),
                light_dimradius:    obj.get('light_dimradius'),
                light_otherplayers: obj.get('light_otherplayers'),
                light_hassight:     obj.get('light_hassight'),
                light_angle:        obj.get('light_angle'),
                light_losangle:     obj.get('light_losangle'),
                light_multiplier:   obj.get('light_multiplier'),
                adv_fow_view_distance: obj.get('adv_fow_view_distance')
            })
            toBack(shadow)
            // remove vision and light from original
            obj.set('light_radius','')
            obj.set('light_dimradius','')
            obj.set('light_otherplayers',false)
            obj.set('light_losangle',0)
            obj.set('adv_fow_view_distance','')
            // save data
            frozen[obj.get('id')] = {shadow:shadow.get('id'),L:L,T:T,R:R}
            shadows[shadow.get('id')] = {original:obj.get('id'),L:L,T:T,R:R}
        }
    } else {
        log(`Unable to freeze object ${obj.get('type')}`)
    }
}

// unfreeze function
function unfreeze(obj){
    var id = obj.get('id')
    if (id in frozen || id in shadows){
        // set to obj/shadow format
        if (id in shadows) {
            var shadow = obj
            id = shadows[id]['original']
            obj = getObj('graphic',id)
        } else {
            var shadow = getObj('graphic',frozen[id]['shadow'])
        }
        // restore vision
        obj.set('light_radius',         shadow.get('light_radius'))
        obj.set('light_dimradius',      shadow.get('light_dimradius'))
        obj.set('light_otherplayers',   shadow.get('light_otherplayers'))
        obj.set('light_losangle',       shadow.get('light_losangle'))
        obj.set('adv_fow_view_distance',shadow.get('adv_fow_view_distance'))
        // delete data
        shadow.remove()
        delete shadows[frozen[id]['shadow']]
        delete frozen[id]
    } else {
        log('Already unfrozen')
    }
}

// limit movement
on('change:token',function(obj){
    id = obj.get('id')
    if (id in frozen){
        obj.set('left',frozen[id]['L'])
        obj.set('top',frozen[id]['T'])
        if (allow_rotation){
            var shadow = getObj('graphic',frozen[id]['shadow'])
            var R = obj.get('rotation')
            shadow.set('rotation',R)
            frozen[id]['R'] = R
            shadows[shadow.get('id')]['R'] = R
        } else {
            obj.set('rotation',frozen[id]['R'])
        }
    } else if (id in shadows){
		obj.set('left',shadows[id]['L'])
		obj.set('top',shadows[id]['T'])
		obj.set('rotation',shadows[id]['R'])
	}
})

//



// trash handling
on('destroy:token',function(obj){
    var id = obj.get('id')
    if (id in frozen || id in shadows){
        unfreeze(obj)
    } 
})