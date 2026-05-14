import "./components/keyboard/keyboard.js";
import "./components/staff/staff.js";

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
window.Staff.initRange("A0", "B3", "FA");
