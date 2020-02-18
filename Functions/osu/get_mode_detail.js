module.exports = function (mode) {
    const modelist = [{modename: "Standard",       modeicon: '<:osu:582883671501963264>'        , check_type: 'Bancho'  , link: 'ppy.sh'},
                      {modename: "Taiko",          modeicon: '<:taiko:582883837554458626>'      , check_type: 'Bancho'  , link: 'ppy.sh'},
                      {modename: "CTB",            modeicon: '<:ctb:582883855627845703>'        , check_type: 'Bancho'  , link: 'ppy.sh'},
                      {modename: "Mania",          modeicon: '<:mania:582883872568639490>'      , check_type: 'Bancho'  , link: 'ppy.sh'},
                      {modename: "Ripple",         modeicon: ''                                 , check_type: 'Ripple'  , link: 'ripple.moe'},
                      ,
                      ,
                      ,
                      {modename: "Akatsuki",       modeicon: '<:akatsukiosu:583310654648352796>', check_type: 'Akatsuki', link: 'akatsuki.pw'},
                      ,
                      ,
                      ,
                      {modename: "Relax Akatsuki", modeicon: '<:rxakatsuki:583314118933610497>' , check_type: 'Akatsuki', link: 'akatsuki.pw'},
                      {modename: "Horizon",        modeicon: ''                                 , check_type: 'Horizon' , link: 'lemres.de'},
                      ,
                      ,
                      ,
                      {modename: "Relax Horizon",  modeicon: ''                                 , check_type: 'Horizon' , link: 'lemres.de'}]
    return modelist[mode]
}