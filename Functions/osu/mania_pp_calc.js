module.exports = function (star, od, score, objects, mod) {
    // Mod to binary
    let bit = mod.toString(2)
    let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    // Calc
    let nerfod = fullbit[fullbit.length - (Math.log2(2) + 1)] == 1 ? 0.5 : 1
    let nerfpp = (fullbit[fullbit.length - (Math.log2(2) + 1)] == 1 ? 0.5 : 1) * (fullbit[fullbit.length - (Math.log2(1) + 1)] == 1 ? 0.9 : 1)
     //StrainBase
    let sb = Math.pow(5*Math.max(1,star/0.2)-4,2.2)/135*(1+0.1*Math.min(1,objects/1500));
     //StrainMultiplier
    let sm = (score<500000) ? score/500000*0.1 : ((score<600000) ? (score-500000)/100000*0.3 : ((score<700000) ? (score-600000)/100000*0.25+0.3 : ((score<800000) ? (score-700000)/100000*0.2+0.55 : ((score<900000) ? (score-800000)/100000*0.15+0.75 : (score-900000)/100000*0.1+0.9))));
    //AccValue
	let av = (score>=960000) ? od*nerfod*0.02*sb*Math.pow((score-960000)/40000,1.1) : 0 
	return (0.73*Math.pow(Math.pow(av,1.1)+Math.pow(sb*sm,1.1),1/1.1)*1.1*nerfpp);
}