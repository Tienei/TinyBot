class Profile {
    constructor (value) {
        this.username = value[0]
        this.id = value[1]
        this.count300 = value[2]
        this.count100 = value[3]
        this.count50 = value[4]
        this.ss = value[5]
        this.s = value[6]
        this.a = value[7]
        this.playcount = value[8]
        this.rankedscore = value[9]
        this.totalscore = value[10]
        this.pp = value[11]
        this.rank = value[12]
        this.countryrank = value[13]
        this.country = value[14]
        this.level = value[15]
        this.acc = value[16]
        this.events = value[17]
        this.supporter = value[18]
        this.statusicon = value[19]
        this.statustext = value[20]
        this.playstyle = value[21]
        this.bannerurl = value[22]
    }
}

class Osutop {
    constructor (value) {
        //Score
        this.top = value[0]
        this.score = value[1]
        this.userid = value[2]
        this.count300 = value[3]
        this.count100 = value[4]
        this.count50 = value[5]
        this.countmiss = value[6]
        this.countgeki = value[7]
        this.countkatu = value[8]
        this.acc = value[9]
        this.accdetail = value[10]
        this.combo = value[11]
        this.perfect = value[12]
        this.date = value[13]
        this.letter = value[14]
        this.pp = value[15]
        this.mod = value[16]
        //Beatmap
        this.beatmapid = value[17]
        this.title = value[18]
        this.creator = value[19]
        this.diff = value[20]
        this.source = value[21]
        this.artist = value[22]
        this.bpm = value[23]
        this.beatmapsetID = value[24]
        this.fc = value[25]
        this.star = value[26]
        this.timetotal = value[27]
        this.timedrain = value[28]
    }
}

class Score {
    constructor (value) {
        this.scoreid = value[0]
        this.score = value[1]
        this.username = value[2]
        this.count300 = value[3]
        this.count100 = value[4]
        this.count50 = value[5]
        this.countmiss = value[6]
        this.combo = value[7]
        this.countkatu = value[8]
        this.countgeki = value[9]
        this.perfect = value[10]
        this.mod = value[11]
        this.userid = value[12]
        this.date = value[13]
        this.letter = value[14]
        this.pp = value[15]
        this.acc = value[16]
        this.accdetail = value[17]
    }
}

module.exports = { Profile, Osutop, Score }