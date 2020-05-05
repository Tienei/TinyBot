module.exports = function (mode) {
    let server_mode = mode.split('-')[0]
    let a_mode = mode.split('-')[1]
    const modelist = [
{modename: "Standard",       modeicon: '<:bancho_std:707169841215176785>'   , modenum: 0, a_mode: 'std'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Taiko",          modeicon: '<:bancho_taiko:707169852573483009>' , modenum: 1, a_mode: 'taiko', check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "CTB",            modeicon: '<:bancho_ctb:707169803848384512>'   , modenum: 2, a_mode: 'ctb'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Mania",          modeicon: '<:bancho_mania:707169829143969802>' , modenum: 3, a_mode: 'mania', check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Ripple",         modeicon: '<:ripple_std:707170083142631514>'   , modenum: 0, a_mode: 'std'  , check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Akatsuki",       modeicon: '<:akatsuki_std:707169778120261714>' , modenum: 0, a_mode: 'std'  , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Relax Akatsuki", modeicon: '<:akatsuki_rx:707169500977561621>'  , modenum: 0, a_mode: 'rx'   , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Horizon",        modeicon: '<:horizon_std:707170004763803688>'  , modenum: 0, a_mode: 'std'  , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Relax Horizon",  modeicon: '<:horizon_rx:707172160828866560>'   , modenum: 0, a_mode: 'rx'   , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Enjuu",          modeicon: '<:enjuu_std:707169893157437451>'    , modenum: 0, a_mode: 'std'  , check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Gatari",         modeicon: '<:gatari_std:707169945863323700>'   , modenum: 0, a_mode: 'std'  , check_type: 'Gatari'  , link: 'gatari.pw'},]
    return modelist.find(m => m.check_type == server_mode && m.a_mode == a_mode)
}
