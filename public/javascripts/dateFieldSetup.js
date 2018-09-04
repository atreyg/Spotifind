window.addEventListener("load", initDateFields, false);

function initDateFields() {
    let from = document.getElementById("fromDate");
    let to = document.getElementById("toDate");

    let fromPlaceholder = "From (default is today's date)";
    let toPlaceholder = "To (optional)";

    from.placeholder = fromPlaceholder;
    to.placeholder = toPlaceholder;

    let currentDate = new Date().toISOString();
    currentDate = currentDate.substring(0, currentDate.indexOf("T"));
    from.min = currentDate;

    /**
     * TODO : refactor to have one event listener for common events
     */

    from.addEventListener("focus", convertToDateField, false);
    from.addEventListener("blur", checkForClear, false);
    from.addEventListener("input", checkForClear, false);

    from.addEventListener(
        "input",
        function() {
            updateMinDate(from, to);
        },
        false
    );

    to.addEventListener("focus", convertToDateField, false);
    to.addEventListener("blur", checkForClear, false);
    to.addEventListener("input", checkForClear, false);
}

function convertToDateField(e) {
    e.target.type = "date";
}

function checkForClear(e) {
    if (e.target.type === "date" && e.target.value === "") {
        e.target.type = "text";
    }
}

function updateMinDate(from, to) {
    to.min = from.value === "" ? from.min : from.value;

    if (to.min > to.value) {
        to.value = "";
        to.type = "text";
    }
}
