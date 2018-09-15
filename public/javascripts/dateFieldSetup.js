window.addEventListener("load", initDateFields, false);
/**
 * Setup date input form fields in the search bar.
 * Limits user selection to ensure from < to.
 */
function initDateFields() {
    //Store DOM elements
    let from = document.getElementById("fromDate");
    let to = document.getElementById("toDate");

    //Setup placeholders to provide information on how to use the date fields
    let fromPlaceholder = "From (default is today's date)";
    let toPlaceholder = "To (optional)";
    from.placeholder = fromPlaceholder;
    to.placeholder = toPlaceholder;

    //Get today's date and set that as the minimum date selectable
    let currentDate = new Date().toISOString();
    currentDate = currentDate.substring(0, currentDate.indexOf("T"));
    from.min = currentDate;

    //Add common date field functionality to both inputs
    addCommonEventListeners(from);
    addCommonEventListeners(to);

    //Update minimum date selectable when 'from' value is changed
    from.addEventListener(
        "input",
        function() {
            updateMinDate(from, to);
        },
        false
    );
}

/**
 * Add events for converting to a date field and clearing
 * @param {*} domElement date field
 */
function addCommonEventListeners(domElement) {
    domElement.addEventListener("focus", convertToDateField, false);
    domElement.addEventListener("blur", checkForClear, false);
    domElement.addEventListener("input", checkForClear, false);
}

/**
 * Convert field to a date field (text initially to allow placeholder)
 * @param {*} e
 */
function convertToDateField(e) {
    e.target.type = "date";
}

/**
 * Convert field back to a text field on clear to allow placeholder
 * @param {*} e
 */
function checkForClear(e) {
    if (e.target.type === "date" && e.target.value === "") {
        e.target.type = "text";
    }
}

/**
 * Update minimum date allowable on 'to' field with a change in the 'from' field
 * @param {*} from
 * @param {*} to
 */
function updateMinDate(from, to) {
    //Check whether from has a value
    to.min = from.value === "" ? from.min : from.value;

    //If the minimum is higher than the current set value, clear the current value
    if (to.min > to.value) {
        to.value = "";
        to.type = "text";
    }
}
