module.exports = function (mode) {
    let server_mode = mode.split('-')[0]
    let a_mode = mode.split('-')[1]
    const modelist = [
        // Bancho
{modename: "Standard",        modeicon: '<:bancho_std:707169841215176785>'    , modenum: 0, a_mode: 'std'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Taiko",           modeicon: '<:bancho_taiko:707169852573483009>'  , modenum: 1, a_mode: 'taiko', check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "CTB",             modeicon: '<:bancho_ctb:707169803848384512>'    , modenum: 2, a_mode: 'ctb'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Mania",           modeicon: '<:bancho_mania:707169829143969802>'  , modenum: 3, a_mode: 'mania', check_type: 'Bancho'  , link: 'ppy.sh'},
        // Ripple
{modename: "Ripple Standard", modeicon: '<:ripple_std:707170083142631514>'    , modenum: 0, a_mode: 'std'  , check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple Taiko",    modeicon: '<:ripple_taiko:707170093599031297>'  , modenum: 1, a_mode: 'taiko', check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple CTB",      modeicon: '<:ripple_ctb:707170031246639114>'    , modenum: 2, a_mode: 'ctb'  , check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple Mania",    modeicon: '<:ripple_mania:707170042634174494>'  , modenum: 3, a_mode: 'mania', check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple Relax",    modeicon: '<:ripple_rx:707170056227782698>'     , modenum: 0, a_mode: 'rx'   , check_type: 'Ripple'  , link: 'ripple.moe'},
        // Akatsuki
{modename: "Akatsuki",        modeicon: '<:akatsuki_std:707169778120261714>'  , modenum: 0, a_mode: 'std'  , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki Taiko",  modeicon: '<:akatsuki_taiko:707169791533776997>', modenum: 1, a_mode: 'taiko', check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki CTB",    modeicon: '<:akatsuki_ctb:707169460791935026>'  , modenum: 2, a_mode: 'ctb'  , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki Mania",  modeicon: '<:akatsuki_mania:707169482023370762>', modenum: 3, a_mode: 'mania', check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki Relax",  modeicon: '<:akatsuki_rx:707169500977561621>'   , modenum: 0, a_mode: 'rx'   , check_type: 'Akatsuki', link: 'akatsuki.pw'},
        // Horizon
{modename: "Horizon",         modeicon: '<:horizon_std:707170004763803688>'   , modenum: 0, a_mode: 'std'  , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon Taiko",   modeicon: '<:horizon_taiko:707170017883586591>' , modenum: 1, a_mode: 'taiko', check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon CTB",     modeicon: '<:horizon_ctb:707169993183461377>'   , modenum: 2, a_mode: 'ctb'  , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon Mania",   modeicon: '<:horizon_mania:707169980906733578>' , modenum: 3, a_mode: 'mania', check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon Relax",   modeicon: '<:horizon_rx:707172160828866560>'    , modenum: 0, a_mode: 'rx'   , check_type: 'Horizon' , link: 'lemres.de'},
        // Enjuu
{modename: "Enjuu",           modeicon: '<:enjuu_std:707169893157437451>'     , modenum: 0, a_mode: 'std'  , check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Enjuu Taiko",     modeicon: '<:enjuu_taiko:707169906130550825>'   , modenum: 1, a_mode: 'taiko', check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Enjuu CTB",       modeicon: '<:enjuu_ctb:707169863994572820>'     , modenum: 2, a_mode: 'ctb'  , check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Enjuu Mania",     modeicon: '<:enjuu_mania:707169875260604436>'   , modenum: 3, a_mode: 'mania', check_type: 'Enjuu'   , link: 'enjuu.click'},
        // Gatari
{modename: "Gatari",          modeicon: '<:gatari_std:707169945863323700>'    , modenum: 0, a_mode: 'std'  , check_type: 'Gatari'  , link: 'gatari.pw'},
{modename: "Gatari Taiko",    modeicon: '<:gatari_taiko:707169961830776892>'  , modenum: 1, a_mode: 'taiko', check_type: 'Gatari'  , link: 'gatari.pw'},
{modename: "Gatari CTB",      modeicon: '<:gatari_ctb:707169918852005889>'    , modenum: 2, a_mode: 'ctb'  , check_type: 'Gatari'  , link: 'gatari.pw'},
{modename: "Gatari Mania",    modeicon: '<:gatari_mania:707169931354963999>'  , modenum: 3, a_mode: 'mania', check_type: 'Gatari'  , link: 'gatari.pw'},]
    return modelist.find(m => m.check_type == server_mode && m.a_mode == a_mode)
}
