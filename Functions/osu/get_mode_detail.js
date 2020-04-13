module.exports = function (mode) {
    let server_mode = mode.split('-')[0]
    let a_mode = mode.split('-')[1]
    const modelist = [
{modename: "Standard",       modeicon: '<:osu:582883671501963264>'        , modenum: 0, a_mode: 'std'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Taiko",          modeicon: '<:taiko:582883837554458626>'      , modenum: 1, a_mode: 'taiko', check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "CTB",            modeicon: '<:ctb:582883855627845703>'        , modenum: 2, a_mode: 'ctb'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Mania",          modeicon: '<:mania:582883872568639490>'      , modenum: 3, a_mode: 'mania', check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Ripple",         modeicon: ''                                 , modenum: 0, a_mode: 'std'  , check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Akatsuki",       modeicon: '<:akatsukiosu:583310654648352796>', modenum: 0, a_mode: 'std'  , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Relax Akatsuki", modeicon: '<:rxakatsuki:583314118933610497>' , modenum: 0, a_mode: 'rx'   , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Horizon",        modeicon: ''                                 , modenum: 0, a_mode: 'std'  , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Relax Horizon",  modeicon: ''                                 , modenum: 0, a_mode: 'rx'   , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Enjuu",          modeiccn: ''                                 , modenum: 0, a_mode: 'std'  , check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Gatari",         modeiccn: ''                                 , modenum: 0, a_mode: 'std'  , check_type: 'Gatari'  , link: 'gatari.pw'},]
    return modelist.find(m => m.check_type == server_mode && m.a_mode == a_mode)
}