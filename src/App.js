import "./components/keyboard/keyboard.js";
import "./components/staff/staff.js";

window.Piano.init(1, 7);

// all 3 staffs with same range
// window.Staff.init(0, 8, "SOL");
// window.Staff.init(0, 8, "DO");
// window.Staff.init(0, 8, "FA");

// different ranges for each staff. No repeat notes across staffs.
// window.Staff.init(5, 8, "SOL");
// window.Staff.init(3, 5, "DO");
// window.Staff.init(0, 3, "FA");

// Best for piano
window.Staff.init(4, 7, "SOL");
window.Staff.init(1, 4, "FA");
