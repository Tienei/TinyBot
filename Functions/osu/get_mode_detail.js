module.exports = function (mode) {
    const modelist = [{name: "Standard", icon: '<:osu:582883671501963264>'},
                    {name: "Taiko", icon: '<:taiko:582883837554458626>'},
                    {name: "CTB", icon: '<:ctb:582883855627845703>'},
                    {name: "Mania", icon: '<:mania:582883872568639490>'},
                    {name: "Ripple", icon: ''},,,,
                    {name: "Akatsuki", icon: '<:akatsukiosu:583310654648352796>'},,,,
                    {name: "Relax Akatsuki", icon: '<:rxakatsuki:583314118933610497>'}]
    return {modename: modelist[mode].name, modeicon: modelist[mode].icon}
}
