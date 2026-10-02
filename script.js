const KEY = "winterArcTracker_v2";
const START_KEY = "winterArcTracker_start_v2";

// Persistent Start Date (anchors the 12-week challenge)
function getStartDate() {
    const saved = localStorage.getItem(START_KEY);
    if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
            d.setHours(0, 0, 0, 0);
            return d;
        }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    localStorage.setItem(START_KEY, today.toISOString());
    return today;
}

const START = getStartDate();

// Daily routines with NoFap checklist item included on every single day
const routines = {
    0: ["No Fap (Clean Day) 🔥", "Weekly academic revision", "LeetCode / DSA", "AI / Backend project", "Muay Thai (optional/light)", "Weekly review & planning", "Sleep 7–8h"],
    1: ["No Fap (Clean Day) 🔥", "College", "Study / college revision", "Internship skill / project", "LeetCode", "Gym", "Muay Thai", "Sleep 7–8h"],
    2: ["No Fap (Clean Day) 🔥", "College", "Study / college revision", "LeetCode", "Gym", "Sleep 7–8h"],
    3: ["No Fap (Clean Day) 🔥", "College", "Study / college revision", "Internship skill / project", "LeetCode", "Gym", "Sleep 7–8h"],
    4: ["No Fap (Clean Day) 🔥", "College", "Study / college revision", "Internship skill / project", "LeetCode", "Muay Thai", "Sleep 7–8h"],
    5: ["No Fap (Clean Day) 🔥", "College", "Study / college revision", "LeetCode", "Gym", "Muay Thai (light)", "AI / Backend project", "Sleep 7–8h"],
    6: ["No Fap (Clean Day) 🔥", "College", "Study / college revision", "LeetCode", "Gym", "Sleep 7–8h"]
};

const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isNoFapTask(taskName) {
    return /no\s*fap/i.test(taskName);
}

function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
        return {};
    } catch (e) {
        return {};
    }
}
let data = load();

function keyFor(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function pretty(d) {
    return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
    updateStats();
}

function toggle(dayKey, i, el) {
    if (!data[dayKey]) data[dayKey] = {};
    data[dayKey][i] = el.checked;

    if (el.closest('.task').classList.contains('nofap-task')) {
        el.closest('.task').classList.toggle("done", el.checked);
    } else {
        el.parentElement.classList.toggle("done", el.checked);
    }

    save();
    updateDayProgress(dayKey);
}

function updateDayProgress(dayKey) {
    const box = document.querySelector(`[data-day="${dayKey}"]`);
    if (!box) return;
    const checks = box.querySelectorAll("input[type=checkbox]");
    const done = [...checks].filter(x => x.checked).length;
    const pct = checks.length ? Math.round(done / checks.length * 100) : 0;
    box.querySelector(".bar").style.width = pct + "%";
    box.querySelector(".pct").textContent = pct + "%";

    // Update NoFap badge on day header
    const nfBadge = box.querySelector(".badge-nofap-clean");
    const d = new Date(dayKey + "T00:00:00");
    const tasks = routines[d.getDay()] || [];
    const nfIdx = tasks.findIndex(isNoFapTask);
    const isClean = nfIdx !== -1 && data[dayKey] && !!data[dayKey][nfIdx];
    if (nfBadge) {
        nfBadge.style.display = isClean ? "inline-block" : "none";
    }
}

// Check if a given date has NoFap completed
function isDayNoFapDone(d) {
    const dKey = keyFor(d);
    const tasks = routines[d.getDay()] || [];
    const nfIdx = tasks.findIndex(isNoFapTask);
    if (nfIdx === -1) return false;
    return !!(data[dKey] && data[dKey][nfIdx] === true);
}

// Calculate NoFap streak: resets on the day when NoFap was not checked
function calculateNoFapStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDone = isDayNoFapDone(today);

    // Check yesterday's status
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDone = isDayNoFapDone(yesterday);

    let streak = 0;
    let checkDate = new Date(today);

    if (todayDone) {
        // Today is checked -> streak starts at 1, then count consecutive previous days
        streak = 1;
        checkDate.setDate(today.getDate() - 1);
    } else {
        // Today is not checked yet.
        // If yesterday was NOT checked, streak is 0
        if (!yesterdayDone) {
            return { streak: 0, todayDone: false, yesterdayDone: false };
        }
        // If yesterday was checked, streak is count of unbroken days up to yesterday
        streak = 1;
        checkDate.setDate(today.getDate() - 2);
    }

    // Traverse consecutive previous days backwards
    // If any day was not checked, the streak breaks and stops!
    while (true) {
        if (checkDate < START) {
            break;
        }
        if (isDayNoFapDone(checkDate)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Broken streak! Resets at this point
            break;
        }
    }

    return { streak, todayDone, yesterdayDone };
}

function render() {
    const root = document.getElementById("tracker");
    root.innerHTML = "";
    const todayStr = keyFor(new Date());

    for (let w = 0; w < 12; w++) {
        const week = document.createElement("div");
        week.className = "week";
        const ws = new Date(START);
        ws.setDate(START.getDate() + w * 7);
        week.innerHTML = `<div class="week-title">
            <span>WEEK ${w + 1}</span>
            <span>${ws.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} →</span>
        </div>`;

        for (let j = 0; j < 7; j++) {
            const d = new Date(ws);
            d.setDate(ws.getDate() + j);
            const dayKey = keyFor(d);
            const dow = d.getDay();
            const tasks = routines[dow];
            const saved = data[dayKey] || {};
            const isToday = dayKey === todayStr;

            const day = document.createElement("div");
            day.className = "day" + (isToday ? " is-today" : "");
            day.dataset.day = dayKey;
            day.id = "day-" + dayKey;

            const taskHTML = tasks.map((t, i) => {
                const checked = !!saved[i];
                const isNF = isNoFapTask(t);
                const taskClass = `task ${isNF ? 'nofap-task' : ''} ${checked ? 'done' : ''}`;
                return `<label class="${taskClass}">
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggle('${dayKey}',${i},this)">
                    <span>${t}</span>
                </label>`;
            }).join("");

            day.innerHTML = `
                <div class="day-head">
                    <div>
                        <div class="day-name">
                            ${names[dow]}
                        </div>
                        <div class="date-text">${pretty(d)}</div>
                    </div>
                    <div class="badges-group">
                        <span class="badge badge-nofap-clean" style="display:none;">🔥 CLEAN</span>
                        ${isToday ? '<span class="badge badge-today">TODAY</span>' : ''}
                        <span class="badge">${dow === 0 ? 'REST / RESET' : (dow === 1 || dow === 3 || dow === 5 || dow === 6 ? 'GYM DAY' : 'MUAY THAI DAY')}</span>
                    </div>
                </div>
                <div class="tasks">${taskHTML}</div>
                <div class="progress"><div class="bar"></div></div>
                <div class="date-text" style="margin-top:6px"><span class="pct">0%</span> complete</div>
            `;
            week.appendChild(day);
        }
        root.appendChild(week);
    }
    for (const k of Object.keys(data)) updateDayProgress(k);
    updateStats();
}

function updateStats() {
    let total = 0, done = 0, perfect = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let w = 0; w < 12; w++) {
        const ws = new Date(START);
        ws.setDate(START.getDate() + w * 7);
        for (let j = 0; j < 7; j++) {
            const d = new Date(ws);
            d.setDate(ws.getDate() + j);
            const arr = routines[d.getDay()];
            const s = data[keyFor(d)] || {};
            const n = arr.filter((_, i) => s[i]).length;
            total += arr.length;
            done += n;
            if (n === arr.length) perfect++;
        }
    }

    // Update NoFap Streak
    const nfInfo = calculateNoFapStreak();
    document.getElementById("nofapStreak").textContent = nfInfo.streak;
    const nfStatusEl = document.getElementById("nofapStatus");
    if (nfInfo.todayDone) {
        nfStatusEl.textContent = "⚡ Clean today! Streak active.";
        nfStatusEl.className = "nofap-status active";
    } else if (nfInfo.streak > 0) {
        nfStatusEl.textContent = "⏳ Pending check-in for today";
        nfStatusEl.className = "nofap-status";
    } else {
        nfStatusEl.textContent = "0 clean days checked — Check off today to start!";
        nfStatusEl.className = "nofap-status";
    }

    document.getElementById("daysDone").textContent = perfect;
    document.getElementById("totalDone").textContent = done;

    // Week stats
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    let wd = 0, wt = 0;
    for (let j = 0; j < 7; j++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + j);
        const arr = routines[d.getDay()], s = data[keyFor(d)] || {};
        wt += arr.length;
        wd += arr.filter((_, i) => s[i]).length;
    }
    document.getElementById("weekPercent").textContent = wt ? Math.round(wd / wt * 100) + "%" : "0%";

    // Overall all-tasks Streak
    let streak = 0;
    for (let offset = 0; offset < 84; offset++) {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        const arr = routines[d.getDay()], s = data[keyFor(d)] || {};
        if (arr.length && arr.every((_, i) => s[i])) streak++;
        else if (offset === 0) continue;
        else break;
    }
    document.getElementById("streak").textContent = streak;
}

function goToday() {
    const el = document.getElementById("day-" + keyFor(new Date()));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetAll() {
    if (confirm("Reset ALL tracker data and streaks? This cannot be undone.")) {
        data = {};
        localStorage.removeItem(KEY);
        localStorage.removeItem(START_KEY);
        localStorage.removeItem("winterArcTracker_v1");
        location.reload();
    }
}

function exportData() {
    const exportObj = {
        startDate: START.toISOString(),
        data: data,
        version: "v2"
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "winter-arc-nofap-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

function importDataPrompt() {
    document.getElementById('importInput').click();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            if (imported.data) {
                data = imported.data;
                if (imported.startDate) {
                    localStorage.setItem(START_KEY, imported.startDate);
                }
            } else {
                data = imported;
            }
            save();
            render();
            alert("Progress imported successfully!");
        } catch (err) {
            alert("Invalid JSON file.");
        }
    };
    reader.readAsText(file);
}

// Initial render
render();
