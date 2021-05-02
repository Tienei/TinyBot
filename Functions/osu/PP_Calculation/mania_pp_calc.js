module.exports = ({mod, star, score, od, obj_count}) => {
    // Mod to binary
    let mods = []
    mod = mod.replace('+', '')
    for (let i = 0; i < mod.length; i+=2) {
        mods.push(mod.substr(i,2))
    }
    score *= Math.pow(0.5, Number(mods.includes("EZ"))+Number(mods.includes("NF"))+Number(mods.includes("HT")))
    let nerfpp = (mods.includes("EZ")?0.5:1) * (mods.includes("NF")?0.9:1)
    //
    // Nerf od and pp
    var sb = Math.pow(5*Math.max(1,star/0.2)-4,2.2)/135*(1+0.1*Math.min(1,obj_count/1500)); //StrainBase
    var sm = (score<500000) ? score/500000*0.1 : ((score<600000) ? (score-500000)/100000*0.3 : ((score<700000) ? (score-600000)/100000*0.25+0.3 : ((score<800000) ? (score-700000)/100000*0.2+0.55 : ((score<900000) ? (score-800000)/100000*0.15+0.75 : (score-900000)/100000*0.1+0.9)))); //StrainMultiplier
    var av = (score>=960000) ? od*0.02*sb*Math.pow((score-960000)/40000,1.1) : 0; //AccValue
    return 0.73*Math.pow(Math.pow(av,1.1)+Math.pow(sb*sm,1.1),1/1.1)*1.1*nerfpp;
}