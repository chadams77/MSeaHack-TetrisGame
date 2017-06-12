window.OC = window.OC || {};

OC._sound = function() {
    
    var acClass = window.AudioContext || window.webkitAudioContext;
    if (!acClass) {
        console.log('WebAudio not supported.');
        return;
    }
    this.audioCtx = new acClass();

    this.music_a = Math.pow(2.0, 1.0/12.0);
    this.music_NoteFreq = function(octave, halfStep) {
        var steps = (halfStep-9) + (octave - 4) * 12;
        while (steps > 24) {
            steps -= 12;
        }
        return f = 440.0 * Math.pow(this.music_a, steps);
    };
    this.music_scale = [0, 2, 3, 5, 7, 8, 11];

    this.lastNote = null;
};

OC._sound.prototype.update = function(dt) {

    var time = this.audioCtx.currentTime;
    if (!this.lastNote || (time - this.lastNote) > 1 / 1.5) {
        this.lastNote = (this.lastNote || time) + 1;
        var note = 30 + Math.floor(Math.random()*14);
        this.play(note, 0.04, 3.0, this.lastNote);
        this.play(note+3, 0.04, 3.0, this.lastNote + 1/2);
    }
};
OC._sound.prototype.play = function(int, amp, length, toffset) {
    var audioCtx = this.audioCtx;
    var time = toffset ? (toffset + audioCtx.currentTime) : audioCtx.currentTime;
    var length = length || 1.0;
    var osc = audioCtx.createOscillator();
    var offset = int % this.music_scale.length;
    var octave = (int - offset) / this.music_scale.length;
    osc.frequency.value = this.music_NoteFreq(octave, this.music_scale[offset]);
    var gain = audioCtx.createGain();
    gain.gain.value = amp;

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);

    for (var i=0; i<8; i++) {
        gain.gain.setValueAtTime(0.35 * amp * Math.pow(1 - (i/8), 8.0), time + i/8);
    }

    window.setTimeout(function(){
        osc.stop();
        osc = null;
        gain = null;
        conv = null;
    }, Math.ceil(1000*length));
};


OC.sound = new OC._sound();