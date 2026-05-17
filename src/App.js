import "./components/keyboard/keyboard.js";
import "./components/staff/staff.js";
import "./components/music-board/music-board.js";
import "./components/speed-staff/speed-staff.js";
import "./components/metronome/metronome.js";
import "./components/speaker/speaker.js";
import "./components/layout/layout.js";

window.LaunchEvent = function (detail) {
    document.dispatchEvent(new CustomEvent("launch-event", {
        detail: detail
    }));
};

document.addEventListener("piano-note-hover", (event) => {
    window.Staff.highlight(event.detail.note);
});

document.addEventListener("piano-note-unhover", (event) => {
    window.Staff.unhighlight(event.detail.note);
});

document.addEventListener("staff-note-hover", (event) => {
    window.Piano.highlight(event.detail.note);
});

document.addEventListener("staff-note-unhover", (event) => {
    window.Piano.unhighlight(event.detail.note);
});

window.Piano.initRange("A0", "C8");

// all 3 staffs with same range
// window.Staff.initRange("A0", "C8", "SOL");
// window.Staff.initRange("A0", "C8", "DO");
// window.Staff.initRange("A0", "C8", "FA");

// different ranges for each staff. No repeat notes across staffs.
// window.Staff.initOctave(5, 8, "SOL");
// window.Staff.initOctave(3, 5, "DO");
// window.Staff.initOctave(0, 3, "FA");

// Best for piano
window.Staff.initRange("C4", "C8", "SOL");
window.Staff.initRange("A0", "C4", "FA");

window.LaunchEvent({
    notes: [
        { nota: "DO4", color: "yellow" }
    ]
});

window.MusicBoard.init();
window.SpeedStaff.init({
    name: "Custom-Row-4",
    clave: "SOL",
    size: {
        wPercentage: "70",
        h: null // is (5 + guideLinesAbove + guideLinesBelow) x rows.heightPx, so can be left null
    },
    position: {
        xPercentage: "15",
        yPx: "50",
    },
    rows: {
        guideLinesAbove: 1,
        guideLinesBelow: 1,
        heightPx: 12
    }
});
window.SpeedStaff.init({
    name: "Custom-Row-4",
    clave: "FA",
    size: {
        wPercentage: "70",
        h: null // is (5 + guideLinesAbove + guideLinesBelow) x rows.heightPx, so can be left null
    },
    position: {
        xPercentage: "15",
        yPx: "220",
    },
    rows: {
        guideLinesAbove: 5,
        guideLinesBelow: 5,
        heightPx: 12
    }
});
SpeedStaff.show.notes(0);
SpeedStaff.show.notes(1);
SpeedStaff.show.edgeLine(0);
SpeedStaff.show.edgeLine(1);

window.Metronome.init(120);
window.Speaker.init();
