
// ==========================================
// ATTENDIFY - STUDENT ATTENDANCE MANAGEMENT
// ==========================================

// DATABASE USING LOCAL STORAGE

let students = JSON.parse(localStorage.getItem("attendify_students")) || [];
let attendance = JSON.parse(localStorage.getItem("attendify_attendance")) || [];

const $ = id => document.getElementById(id);

function saveDatabase() {
    localStorage.setItem("attendify_students", JSON.stringify(students));
    localStorage.setItem("attendify_attendance", JSON.stringify(attendance));
}

function getLocalDate() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
        .toISOString().slice(0, 10);
}

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function emptyRow(columns, message) {
    return `<tr><td colspan="${columns}" class="empty-row">${message}</td></tr>`;
}

// ==========================================
// NAVIGATION
// ==========================================

const pageTitles = {
    dashboard: "Dashboard",
    students: "Student Registration",
    mark: "Mark Attendance",
    records: "View Attendance",
    reports: "Attendance Reports"
};

function openPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    $(page).classList.add("active");
    $("page-heading").textContent = pageTitles[page];

    if (page === "dashboard") renderDashboard();
    if (page === "students") renderStudents();
    if (page === "mark") renderMarkAttendance();
    if (page === "records") renderRecords();
    if (page === "reports") renderReports();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.go);
    });
});

// ==========================================
// STUDENT REGISTRATION
// ==========================================

$("show-form").addEventListener("click", () => {
    resetStudentForm();
    $("student-form-panel").hidden = false;
    $("student-form-panel").scrollIntoView({
        behavior: "smooth"
    });
});

$("cancel-form").addEventListener("click", () => {
    $("student-form-panel").hidden = true;
    resetStudentForm();
});

function resetStudentForm() {
    $("student-form").reset();
    $("edit-id").value = "";
    $("form-title").textContent = "Register New Student";
}

$("student-form").addEventListener("submit", event => {
    event.preventDefault();

    const id = $("edit-id").value;
    const roll = $("roll-number").value.trim().toUpperCase();

    const duplicate = students.some(student =>
        student.roll.toUpperCase() === roll &&
        student.id !== id
    );

    if (duplicate) {
        showToast("This roll number already exists!");
        return;
    }

    const student = {
        id: id || Date.now().toString(),
        name: $("student-name").value.trim(),
        roll: roll,
        email: $("student-email").value.trim(),
        department: $("department").value,
        year: $("student-year").value,
        phone: $("student-phone").value.trim()
    };

    if (id) {
        students = students.map(item =>
            item.id === id ? student : item
        );

        showToast("Student updated successfully!");
    } else {
        students.push(student);
        showToast("Student registered successfully!");
    }

    saveDatabase();
    resetStudentForm();
    $("student-form-panel").hidden = true;

    renderStudents();
    renderDashboard();
});

function editStudent(id) {
    const student = students.find(item => item.id === id);

    if (!student) return;

    $("edit-id").value = student.id;
    $("student-name").value = student.name;
    $("roll-number").value = student.roll;
    $("student-email").value = student.email;
    $("department").value = student.department;
    $("student-year").value = student.year;
    $("student-phone").value = student.phone;

    $("form-title").textContent = "Update Student Details";
    $("student-form-panel").hidden = false;

    $("student-form-panel").scrollIntoView({
        behavior: "smooth"
    });
}

function deleteStudent(id) {
    const student = students.find(item => item.id === id);

    if (!student) return;

    if (!confirm(`Delete ${student.name} and all their attendance records?`)) {
        return;
    }

    students = students.filter(item => item.id !== id);
    attendance = attendance.filter(item => item.studentId !== id);

    saveDatabase();
    renderStudents();
    renderDashboard();

    showToast("Student and attendance records deleted.");
}

function renderStudents() {
    const search = $("student-search").value.toLowerCase();

    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.roll.toLowerCase().includes(search) ||
        student.department.toLowerCase().includes(search)
    );

    $("student-count").textContent =
        `${students.length} students registered`;

    $("student-table").innerHTML = filtered.length
        ? filtered.map(student => `
            <tr>
                <td><strong>${escapeHTML(student.roll)}</strong></td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.department)}</td>
                <td>${escapeHTML(student.year)}</td>
                <td>${escapeHTML(student.email || "-")}</td>
                <td>
                    <button class="action-btn edit-btn"
                        data-edit="${student.id}">Edit</button>

                    <button class="action-btn delete-btn"
                        data-delete="${student.id}">Delete</button>
                </td>
            </tr>
        `).join("")
        : emptyRow(6, "No students found.");

    document.querySelectorAll("[data-edit]").forEach(button => {
        button.onclick = () => editStudent(button.dataset.edit);
    });

    document.querySelectorAll("[data-delete]").forEach(button => {
        button.onclick = () => deleteStudent(button.dataset.delete);
    });
}

$("student-search").addEventListener("input", renderStudents);

// ==========================================
// MARK ATTENDANCE
// ==========================================

$("attendance-date").value = getLocalDate();

$("attendance-date").addEventListener("change", renderMarkAttendance);

$("department-filter").addEventListener("change", renderMarkAttendance);

let attendanceDraft = {};

function renderMarkAttendance() {
    const date = $("attendance-date").value;
    const department = $("department-filter").value;

    const filtered = students.filter(student =>
        !department || student.department === department
    );

    attendanceDraft = {};

    filtered.forEach(student => {
        const existing = attendance.find(record =>
            record.studentId === student.id &&
            record.date === date
        );

        attendanceDraft[student.id] = existing
            ? existing.status
            : "Absent";
    });

    renderMarkTable(filtered);
}

function renderMarkTable(filtered) {
    $("mark-table").innerHTML = filtered.length
        ? filtered.map(student => `
            <tr>
                <td><strong>${escapeHTML(student.roll)}</strong></td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.department)}</td>
                <td>
                    <div class="attendance-choice">
                        <button
                            class="${attendanceDraft[student.id] === "Present"
                                ? "selected-present" : ""}"
                            data-status-id="${student.id}"
                            data-status="Present">
                            Present
                        </button>

                        <button
                            class="${attendanceDraft[student.id] === "Absent"
                                ? "selected-absent" : ""}"
                            data-status-id="${student.id}"
                            data-status="Absent">
                            Absent
                        </button>
                    </div>
                </td>
            </tr>
        `).join("")
        : emptyRow(4, "Register students before marking attendance.");

    document.querySelectorAll("[data-status-id]").forEach(button => {
        button.onclick = () => {
            const id = button.dataset.statusId;
            const status = button.dataset.status;

            attendanceDraft[id] = status;

            const filtered = students.filter(student =>
                !$("department-filter").value ||
                student.department === $("department-filter").value
            );

            renderMarkTable(filtered);
        };
    });

    updateMarkSummary(filtered);
}

function updateMarkSummary(filtered) {
    const present = filtered.filter(student =>
        attendanceDraft[student.id] === "Present"
    ).length;

    $("mark-total").textContent = filtered.length;
    $("mark-present").textContent = present;
    $("mark-absent").textContent = filtered.length - present;
}

$("save-attendance").addEventListener("click", () => {
    const date = $("attendance-date").value;

    if (!date) {
        showToast("Please select an attendance date.");
        return;
    }

    const department = $("department-filter").value;

    const filtered = students.filter(student =>
        !department || student.department === department
    );

    if (!filtered.length) {
        showToast("No students available.");
        return;
    }

    filtered.forEach(student => {
        const existingIndex = attendance.findIndex(record =>
            record.studentId === student.id &&
            record.date === date
        );

        const record = {
            studentId: student.id,
            date: date,
            status: attendanceDraft[student.id] || "Absent"
        };

        if (existingIndex >= 0) {
            attendance[existingIndex] = record;
        } else {
            attendance.push(record);
        }
    });

    saveDatabase();

    showToast("Attendance saved successfully!");

    renderMarkAttendance();
    renderDashboard();
});

// ==========================================
// VIEW ATTENDANCE RECORDS
// ==========================================

$("record-date").addEventListener("change", renderRecords);
$("record-search").addEventListener("input", renderRecords);
$("record-status").addEventListener("change", renderRecords);

$("clear-record-filters").addEventListener("click", () => {
    $("record-date").value = "";
    $("record-search").value = "";
    $("record-status").value = "";

    renderRecords();
});

function renderRecords() {
    const date = $("record-date").value;
    const search = $("record-search").value.toLowerCase();
    const status = $("record-status").value;

    let records = attendance.map(record => {
        const student = students.find(item =>
            item.id === record.studentId
        );

        return student ? {
            ...record,
            name: student.name,
            roll: student.roll,
            department: student.department
        } : null;
    }).filter(Boolean);

    records = records.filter(record =>
        (!date || record.date === date) &&
        (!search || record.roll.toLowerCase().includes(search)) &&
        (!status || record.status === status)
    );

    records.sort((a, b) =>
        b.date.localeCompare(a.date) ||
        a.roll.localeCompare(b.roll)
    );

    $("record-table").innerHTML = records.length
        ? records.map(record => `
            <tr>
                <td>${formatDate(record.date)}</td>
                <td><strong>${escapeHTML(record.roll)}</strong></td>
                <td>${escapeHTML(record.name)}</td>
                <td>${escapeHTML(record.department)}</td>
                <td>
                    <span class="status ${
                        record.status === "Present"
                            ? "status-present" : "status-absent"
                    }">
                        ${record.status}
                    </span>
                </td>
            </tr>
        `).join("")
        : emptyRow(5, "No attendance records found.");
}

// ==========================================
// ATTENDANCE REPORTS
// ==========================================

$("report-department").addEventListener("change", renderReports);

function getStudentReport(student) {
    const records = attendance.filter(record =>
        record.studentId === student.id
    );

    const total = records.length;

    const present = records.filter(record =>
        record.status === "Present"
    ).length;

    const absent = total - present;

    const percentage = total
        ? (present / total) * 100
        : 0;

    return {
        total,
        present,
        absent,
        percentage
    };
}

function renderReports() {
    const department = $("report-department").value;

    const filtered = students.filter(student =>
        !department || student.department === department
    );

    const reports = filtered.map(student => ({
        student,
        ...getStudentReport(student)
    }));

    const totalPresent = reports.reduce(
        (sum, report) => sum + report.present, 0
    );

    const totalClasses = reports.reduce(
        (sum, report) => sum + report.total, 0
    );

    const average = totalClasses
        ? (totalPresent / totalClasses) * 100
        : 0;

    const low = reports.filter(report =>
        report.total > 0 && report.percentage < 75
    ).length;

    $("report-total").textContent = filtered.length;
    $("report-average").textContent = `${average.toFixed(1)}%`;
    $("report-low").textContent = low;

    $("report-table").innerHTML = reports.length
        ? reports.map(report => `
            <tr>
                <td><strong>${escapeHTML(report.student.roll)}</strong></td>
                <td>${escapeHTML(report.student.name)}</td>
                <td>${escapeHTML(report.student.department)}</td>
                <td>${report.total}</td>
                <td>${report.present}</td>
                <td>${report.absent}</td>
                <td class="${
                    report.percentage < 75 && report.total > 0
                        ? "low-percentage" : "percentage"
                }">
                    ${report.total
                        ? report.percentage.toFixed(1) + "%"
                        : "No records"}
                </td>
            </tr>
        `).join("")
        : emptyRow(7, "No registered students found.");
}

// ==========================================
// DOWNLOAD ATTENDANCE REPORT AS CSV
// ==========================================

$("download-report").addEventListener("click", () => {
    const department = $("report-department").value;

    const filtered = students.filter(student =>
        !department || student.department === department
    );

    if (!filtered.length) {
        showToast("No students available for report.");
        return;
    }

    const rows = [
        [
            "Roll Number",
            "Student Name",
            "Department",
            "Total Classes",
            "Present",
            "Absent",
            "Attendance Percentage"
        ]
    ];

    filtered.forEach(student => {
        const report = getStudentReport(student);

        rows.push([
            student.roll,
            student.name,
            student.department,
            report.total,
            report.present,
            report.absent,
            report.total
                ? report.percentage.toFixed(2) + "%"
                : "No records"
        ]);
    });

    const csv = rows.map(row =>
        row.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-attendance-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showToast("Attendance report downloaded!");
});

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {
    const today = getLocalDate();

    const todayRecords = attendance.filter(record =>
        record.date === today
    );

    const present = todayRecords.filter(record =>
        record.status === "Present"
    ).length;

    const absent = todayRecords.filter(record =>
        record.status === "Absent"
    ).length;

    const total = todayRecords.length;

    const rate = total
        ? (present / total) * 100
        : 0;

    $("total-students").textContent = students.length;
    $("present-today").textContent = present;
    $("absent-today").textContent = absent;
    $("attendance-rate").textContent = rate.toFixed(1) + "%";
    $("summary-percent").textContent = rate.toFixed(1) + "%";

    const degrees = rate * 3.6;

    $("summary-circle").style.background =
        `conic-gradient(var(--green) ${degrees}deg, #edf0f5 ${degrees}deg)`;

    const recent = [...students].reverse().slice(0, 5);

    $("recent-students").innerHTML = recent.length
        ? recent.map(student => `
            <tr>
                <td>${escapeHTML(student.roll)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.department)}</td>
                <td>${escapeHTML(student.year)}</td>
            </tr>
        `).join("")
        : emptyRow(4, "No students registered yet.");
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatDate(date) {
    if (!date) return "-";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
}

// ==========================================
// INITIALISE APPLICATION
// ==========================================

$("today-date").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

$("attendance-date").value = getLocalDate();

renderDashboard();
renderStudents();
renderMarkAttendance();
renderRecords();
renderReports();