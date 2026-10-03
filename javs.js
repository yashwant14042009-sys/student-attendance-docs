// ---------- Data ----------
// today: null = not marked, "P" = present, "A" = absent
var students = [
    { name: "Arun",    roll: 101, attended: 46, total: 50, today: null },
    { name: "Priya",   roll: 102, attended: 49, total: 50, today: null },
    { name: "Karthik", roll: 103, attended: 37, total: 50, today: null }
];

// ---------- Helpers ----------
function percent(s) {
    var total = s.total + (s.today ? 1 : 0);
    var attended = s.attended + (s.today === "P" ? 1 : 0);
    return total === 0 ? 0 : Math.round((attended / total) * 100);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// ---------- Menu: switch panels ----------
function showPanel(id, btn) {
    var panels = document.querySelectorAll(".panel");
    var buttons = document.querySelectorAll(".menu-btn");

    for (var i = 0; i < panels.length; i++) {
        panels[i].classList.remove("active");
    }
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].classList.remove("active");
    }

    document.getElementById(id).classList.add("active");
    btn.classList.add("active");
}

// ---------- Stats ----------
function renderStats() {
    var present = 0;
    var absent = 0;

    for (var i = 0; i < students.length; i++) {
        if (students[i].today === "P") present++;
        if (students[i].today === "A") absent++;
    }

    document.getElementById("statTotal").textContent = students.length;
    document.getElementById("statPresent").textContent = present;
    document.getElementById("statAbsent").textContent = absent;
    document.getElementById("statPending").textContent = students.length - present - absent;
}

// ---------- Mark Attendance ----------
function renderMark() {
    var html = "";

    for (var i = 0; i < students.length; i++) {
        var s = students[i];
        var p = percent(s);

        html += '<div class="row">' +
            '<div class="avatar">' + escapeHtml(s.name.charAt(0).toUpperCase()) + '</div>' +
            '<div class="info">' +
                '<h3>' + escapeHtml(s.name) + '</h3>' +
                '<p>Roll No: ' + escapeHtml(s.roll) + ' &bull; ' + p + '% attendance</p>' +
                '<div class="bar"><div class="fill" style="width:' + p + '%"></div></div>' +
            '</div>' +
            '<div>' +
                '<button class="present ' + (s.today === "P" ? "selected" : "") + '" onclick="mark(' + i + ', \'P\')">Present</button> ' +
                '<button class="absent ' + (s.today === "A" ? "selected" : "") + '" onclick="mark(' + i + ', \'A\')">Absent</button>' +
            '</div>' +
        '</div>';
    }

    document.getElementById("markList").innerHTML = html;
}

function mark(index, status) {
    students[index].today = status;
    refresh();
}

// ---------- View Attendance ----------
function renderView() {
    var html = "";
    var labels = { P: "Present", A: "Absent", N: "Not marked" };

    for (var i = 0; i < students.length; i++) {
        var s = students[i];
        var key = s.today || "N";

        html += "<tr>" +
            "<td>" + escapeHtml(s.roll) + "</td>" +
            "<td>" + escapeHtml(s.name) + "</td>" +
            '<td><span class="tag ' + key + '">' + labels[key] + "</span></td>" +
            "<td>" + percent(s) + "%</td>" +
        "</tr>";
    }

    document.getElementById("viewBody").innerHTML = html;
}

// ---------- Generate Report ----------
function renderReport() {
    if (students.length === 0) {
        document.getElementById("reportBox").innerHTML = "<p>No students registered yet.</p>";
        return;
    }

    var sum = 0;
    var best = students[0];
    var shortage = [];

    for (var i = 0; i < students.length; i++) {
        var p = percent(students[i]);
        sum += p;
        if (p > percent(best)) best = students[i];
        if (p < 75) shortage.push(students[i].name);
    }

    var average = Math.round(sum / students.length);

    document.getElementById("reportBox").innerHTML =
        '<div class="report-grid">' +
            '<div class="report-card"><h3>Class average</h3><p>' + average + '%</p></div>' +
            '<div class="report-card"><h3>Best attendance</h3><p>' + escapeHtml(best.name) + ' (' + percent(best) + '%)</p></div>' +
            '<div class="report-card"><h3>Below 75%</h3><p>' +
                (shortage.length ? escapeHtml(shortage.join(", ")) : "None") +
            '</p></div>' +
        '</div>';
}

// ---------- Register Student ----------
function addStudent() {
    var nameInput = document.getElementById("nameInput");
    var rollInput = document.getElementById("rollInput");
    var message = document.getElementById("message");

    var name = nameInput.value.trim();
    var roll = rollInput.value.trim();

    if (name === "" || roll === "") {
        message.textContent = "Enter both the name and the roll number.";
        message.className = "err";
        return;
    }

    for (var i = 0; i < students.length; i++) {
        if (String(students[i].roll) === roll) {
            message.textContent = "Roll number " + roll + " is already registered.";
            message.className = "err";
            return;
        }
    }

    students.push({ name: name, roll: roll, attended: 0, total: 0, today: null });

    nameInput.value = "";
    rollInput.value = "";
    message.textContent = name + " was added to the class.";
    message.className = "ok";

    refresh();
}

// ---------- Redraw everything ----------
function refresh() {
    renderStats();
    renderMark();
    renderView();
    renderReport();
}

refresh();