import "./components/keyboard/keyboard.js";
import "./components/staff/staff.js";
import "./components/music-board/music-board.js";
import "./components/metronome/metronome.js";
import "./components/speaker/speaker.js";

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

window.MusicBoard.init();
window.Metronome.init(120);
window.Speaker.init();
