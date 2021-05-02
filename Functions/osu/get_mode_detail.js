const get_icon = require('./icon_lib')

const modelist = [
        // Bancho
{modename: "Standard",        modenum: 0, a_mode: 'std'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Taiko",           modenum: 1, a_mode: 'taiko', check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "CTB",             modenum: 2, a_mode: 'ctb'  , check_type: 'Bancho'  , link: 'ppy.sh'},
{modename: "Mania",           modenum: 3, a_mode: 'mania', check_type: 'Bancho'  , link: 'ppy.sh'},
        // Ripple
{modename: "Ripple Standard", modenum: 0, a_mode: 'std'  , check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple Taiko",    modenum: 1, a_mode: 'taiko', check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple CTB",      modenum: 2, a_mode: 'ctb'  , check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple Mania",    modenum: 3, a_mode: 'mania', check_type: 'Ripple'  , link: 'ripple.moe'},
{modename: "Ripple Relax",    modenum: 0, a_mode: 'rx'   , check_type: 'Ripple'  , link: 'ripple.moe'},
        // Akatsuki
{modename: "Akatsuki",        modenum: 0, a_mode: 'std'  , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki Taiko",  modenum: 1, a_mode: 'taiko', check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki CTB",    modenum: 2, a_mode: 'ctb'  , check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki Mania",  modenum: 3, a_mode: 'mania', check_type: 'Akatsuki', link: 'akatsuki.pw'},
{modename: "Akatsuki Relax",  modenum: 0, a_mode: 'rx'   , check_type: 'Akatsuki', link: 'akatsuki.pw'},
        // Horizon
{modename: "Horizon",         modenum: 0, a_mode: 'std'  , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon Taiko",   modenum: 1, a_mode: 'taiko', check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon CTB",     modenum: 2, a_mode: 'ctb'  , check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon Mania",   modenum: 3, a_mode: 'mania', check_type: 'Horizon' , link: 'lemres.de'},
{modename: "Horizon Relax",   modenum: 0, a_mode: 'rx'   , check_type: 'Horizon' , link: 'lemres.de'},
        // Enjuu
{modename: "Enjuu",           modenum: 0, a_mode: 'std'  , check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Enjuu Taiko",     modenum: 1, a_mode: 'taiko', check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Enjuu CTB",       modenum: 2, a_mode: 'ctb'  , check_type: 'Enjuu'   , link: 'enjuu.click'},
{modename: "Enjuu Mania",     modenum: 3, a_mode: 'mania', check_type: 'Enjuu'   , link: 'enjuu.click'},
        // Gatari
{modename: "Gatari",          modenum: 0, a_mode: 'std'  , check_type: 'Gatari'  , link: 'gatari.pw'},
{modename: "Gatari Taiko",    modenum: 1, a_mode: 'taiko', check_type: 'Gatari'  , link: 'gatari.pw'},
{modename: "Gatari CTB",      modenum: 2, a_mode: 'ctb'  , check_type: 'Gatari'  , link: 'gatari.pw'},
{modename: "Gatari Mania",    modenum: 3, a_mode: 'mania', check_type: 'Gatari'  , link: 'gatari.pw'},
        // Ainu
{modename: "Ainu",            modenum: 0, a_mode: 'std'  , check_type: 'Ainu'    , link: 'ainu.pw'},
{modename: "Ainu Taiko",      modenum: 1, a_mode: 'taiko', check_type: 'Ainu'    , link: 'ainu.pw'},
{modename: "Ainu CTB",        modenum: 2, a_mode: 'ctb'  , check_type: 'Ainu'    , link: 'ainu.pw'},
{modename: "Ainu Mania",      modenum: 3, a_mode: 'mania', check_type: 'Ainu'    , link: 'ainu.pw'},
        // Datenshi
{modename: "Datenshi",        modenum: 0, a_mode: 'std'  , check_type: 'Datenshi', link: 'osu.troke.id'},
{modename: "Datenshi Taiko",  modenum: 1, a_mode: 'taiko', check_type: 'Datenshi', link: 'osu.troke.id'},
{modename: "Datenshi CTB",    modenum: 2, a_mode: 'ctb'  , check_type: 'Datenshi', link: 'osu.troke.id'},
{modename: "Datenshi Mania",  modenum: 3, a_mode: 'mania', check_type: 'Datenshi', link: 'osu.troke.id'},
{modename: "Danteshi Relax",  modenum: 0, a_mode: 'rx'   , check_type: 'Datenshi', link: 'osu.troke.id'},
        // EZPPFarm
{modename: "EZPPFarm",        modenum: 0, a_mode: 'std'  , check_type: 'EZPPFarm', link: 'ez-pp.farm'},
{modename: "EZPPFarm Taiko",  modenum: 1, a_mode: 'taiko', check_type: 'EZPPFarm', link: 'ez-pp.farm'},
{modename: "EZPPFarm CTB",    modenum: 2, a_mode: 'ctb'  , check_type: 'EZPPFarm', link: 'ez-pp.farm'},
{modename: "EZPPFarm Mania",  modenum: 3, a_mode: 'mania', check_type: 'EZPPFarm', link: 'ez-pp.farm'},
{modename: "EZPPFarm Relax",  modenum: 0, a_mode: 'rx'   , check_type: 'EZPPFarm', link: 'ez-pp.farm'},
        // Kurikku
{modename: "Kurikku",         modenum: 0, a_mode: 'std'  , check_type: 'Kurikku',  link: 'kurikku.pw'},
{modename: "Kurikku Taiko",   modenum: 1, a_mode: 'taiko', check_type: 'Kurikku',  link: 'kurikku.pw'},
{modename: "Kurikku CTB",     modenum: 2, a_mode: 'ctb'  , check_type: 'Kurikku',  link: 'kurikku.pw'},
{modename: "Kurikku Mania",   modenum: 3, a_mode: 'mania', check_type: 'Kurikku',  link: 'kurikku.pw'},]

module.exports = ({mode}) => {
    let server_mode = mode.split('-')[0]
    let a_mode = mode.split('-')[1]
    return {...modelist.find(m => m.check_type == server_mode && m.a_mode == a_mode), modeicon: get_icon({type: mode})}
}