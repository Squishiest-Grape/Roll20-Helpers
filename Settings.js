/*

Area
    Name ''
    Shapes {}
        Transformed {}
            areas
            holes
        Original
            areas
            holes
    x,y,z,r,sX,sY,h
    page,xmin,xmax,ymin,ymax,zmin,zmax
    ControledBy [] - players or characters or sheets
    Color ''
    Parts {} - token or path
        id {type,x,y,r,sX,sY} - types: handel,image,path,shadow
    Effects []
        {stat,change,conditional}
            speed,inf,corporial
    TeleportTo '' - areaName
    
Char
    Name ''
    Parts {}
        id {type}
            main    - image,sides,area,range,status,values push,vision push,name,height
            mask    - area,range,name,height,status push,values push,vision push
            sight   - vision
            aura    - name,area,height
            speed   - speed
            shadow  - 
            height  - 
    Tags { name:id }
    Sides {img,height,width,stats,effects,conditions}
    x,y,z,r,h,width,height
    page,xmin,xmax,ymin,ymax,zmin,zmax
    Color
    ControledBy [] - players or sheets
    DisplaySettings {}
    Stats {type,name,value,protected,control} - type:bool,num,string,list,sight{name,range}
        z,hieght,size,speed,range,blind,locked,corporial,visible,sights,turnbonus
    Conditions []
        {stat,change,conditional,from,count}
    Effects []
        {stat,change,conditional}
    Turn
        IsTurn, Moves, Teleport, Speed, Used, Range



Player
    Name ''
    Color ''
    Page ''
    Maps []
    Controlling []  // area: first controlled token on page, or center of page
    IsGm bool
    AutoRoll


GM Macros:
    MakeChar
    MakeArea
    EditPlayer
    EditMaps
    GiveTurn
    GiveControl
    AutoRoll
    LockAll
    Resize
    AddSide
    Gorup
All Macros
    Maps
    Back
    Edit
    Info

*/

Macro = function(fun,text='',visibility='all',tokenaction=false,macrobar=false){
    // visibility = 'all','gm'
    return {fun:fun,text:text,visibility:visibility,tokenaction:tokenaction,macrobar:macrobar}
}



settings = {

    main: {
        refresh:    false,      // bool
        mask:       'AdvTkn',   // string
    },

    area: {
        overlap:  0,            // number of units from
        overlap_from: 'edge',   // 'edge', 'center'
        handle_size: 2,         // number of units
        line_width:  3,         // number of pnts
        show_image:  true,      // bool
        show_shadow: false,     // bool
        wall_height: 'inf',     // number of units, 'inf'
        wall_effects: [                         // array [effects]
            ['SpeedMult','=inf','!corporial'],  // array [stat,change,conditional]
        ],
    },

    character: {
        display: {
            range:  'combat',   // 'never', 'turn', 'combat', 'always'
            speed:  'turn',     // 'never', 'turn', 'combat', 'always'
            area:   'combat',   // 'never', 'turn', 'combat', 'always'
            invis_name: true,   // bool
            invis_status: false,// bool
            height: 'true',     // bool
        },
        effects: [                              // array [effects]
            ['dificult','=true','!corporial'],  // array [stat,change,conditional]
        ],
        colors: {
            area:   '#000000',  // hex color string starting with #
            speed:  '#4a86e8',  // hex color string starting with #
            tele:   '#674ea7',  // hex color string starting with #
            range:  '#cc4125',  // hex color string starting with #
        },
        sides: {
            size:       true,   // bool
            stats:      true,   // bool
            effects:    true,   // bool
            conditions: false,  // bool
        },
        control: {
            turn_speed: 'player',
            turn_range: 'player',
            turn_tele:  'player',
            turn_back:  'player',
            speed:      'ask',
            range:      'player',
            size:       'gm',
            height:     'gm',
            blind:      'gm',
            locked:     'gm',
            invisible:  'gm',
            sights:     'gm',
            stats:      'gm',
        },
        protected_stats: {
            speed: 30,      // array [value,control:'player','ask','gm']
            range: 5,   // array [value,control:'player','ask','gm']
            size: 5,         // array [value,control:'player','ask','gm']
            height: 5,       // array [value,control:'player','ask','gm']
            blind: false,    // array [value,control:'player','ask','gm']
            locked: false,   // array [value,control:'player','ask','gm']
            invisible: [],   // array [value,control:'player','ask','gm'] (value overwriten)
            sights: {        // array [value,control:'player','ask','gm'] (value overwriten)
                reg: ['inf',360,false],   // array [range,angle,darkvision]
                dark: [0,360,true],       // array [range,angle,darkvision]
            },
        },
        stats: {            
            corporial:  true,           // bool
            sights: {                   // dictionary
                blind: [0,360,true],    // array [range,angle,darkvision]
                devil: [0,360,true],    // array [range,angle,darkvision]
                invis: [0,360,false],   // array [range,angle,darkvision]
                true: [0,360,true],     // array [range,angle,darkvision]
            },
        },
    },

    turns: {
        not_turn:   'locked',   // 'locked','reset','free'
        lock_rotation: true,    // bool
        group:      'sheet',    // 'image', 'sheet', 'player'
        not_blind:  true,       // bool
        reset_speed: true,      // bool    
        reset_range: false,     // bool
    },

}