package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;
import java.util.stream.Collectors;

public class AppointmentsPage extends BasePageModel {
    public static final String APPOINTMENTS_URL = BasePageModel.BASE_URL + "/appointments";

    private static final By APPOINTMENT_CARDS = By.cssSelector(".appointment-card");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");
    private static final By MODAL = By.cssSelector(".modal-overlay");

    @FindBy(css = ".appointments-container h1")
    private WebElement heading;

    @FindBy(css = ".header .btn-primary")
    private WebElement newAppointmentButton;

    @FindBy(css = ".filters select:first-of-type")
    private WebElement statusFilter;

    @FindBy(css = ".filters .filter-input[type='text']")
    private WebElement searchInput;

    @FindBy(css = ".filters .filter-input[type='date'][aria-label='Od datuma']")
    private WebElement dateFromInput;

    @FindBy(css = ".filters .filter-input[type='date'][aria-label='Do datuma']")
    private WebElement dateToInput;

    @FindBy(css = ".filters select:last-of-type")
    private WebElement sortSelect;

    @FindBy(css = ".filters .btn-secondary")
    private WebElement resetButton;

    @FindBy(css = ".appointment-card")
    private List<WebElement> appointmentCards;

    @FindBy(css = ".appointment-card .status-badge")
    private List<WebElement> statusBadges;

    @FindBy(css = ".modal-card h2")
    private WebElement modalHeading;

    @FindBy(css = ".modal-card .btn-light")
    private WebElement modalCancelButton;

    public AppointmentsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public boolean isNewAppointmentButtonVisible() {
        return !driver.findElements(By.cssSelector(".header .btn-primary")).isEmpty()
                && driver.findElement(By.cssSelector(".header .btn-primary")).isDisplayed();
    }

    public List<String> getStatusFilterOptions() {
        wait.until(ExpectedConditions.visibilityOf(statusFilter));
        return new Select(statusFilter).getOptions()
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public String getSelectedStatusValue() {
        wait.until(ExpectedConditions.visibilityOf(statusFilter));
        return new Select(statusFilter).getFirstSelectedOption().getAttribute("value");
    }

    public void selectStatus(String status) {
        wait.until(ExpectedConditions.elementToBeClickable(statusFilter));
        new Select(statusFilter).selectByValue(status);
        waitForPageToSettle();
        waitForStatusFilterResult(status);
    }

    public String getSelectedSortValue() {
        wait.until(ExpectedConditions.visibilityOf(sortSelect));
        return new Select(sortSelect).getFirstSelectedOption().getAttribute("value");
    }

    public List<String> getSortOptions() {
        wait.until(ExpectedConditions.visibilityOf(sortSelect));
        return new Select(sortSelect).getOptions()
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public void selectSort(String sortValue) {
        wait.until(ExpectedConditions.elementToBeClickable(sortSelect));
        new Select(sortSelect).selectByValue(sortValue);
    }

    public int getAppointmentCardsCount() {
        waitForPageToSettle();
        return driver.findElements(APPOINTMENT_CARDS).size();
    }

    public String getFirstAppointmentCardText() {
        waitForPageToSettle();
        return driver.findElements(APPOINTMENT_CARDS).get(0).getText();
    }

    public List<String> getVisibleStatusTexts() {
        waitForPageToSettle();
        return driver.findElements(By.cssSelector(".appointment-card .status-badge"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getVisibleStatusClasses() {
        waitForPageToSettle();
        return driver.findElements(By.cssSelector(".appointment-card .status-badge"))
                .stream()
                .map(element -> element.getAttribute("class"))
                .collect(Collectors.toList());
    }

    public void setSearchTerm(String searchTerm) {
        wait.until(ExpectedConditions.visibilityOf(searchInput));
        searchInput.clear();
        searchInput.sendKeys(searchTerm);
        waitForSearchToApply(searchTerm);
    }

    public String getSearchValue() {
        wait.until(ExpectedConditions.visibilityOf(searchInput));
        return searchInput.getAttribute("value");
    }

    public void setDateFrom(String date) {
        setDateInput(dateFromInput, date);
    }

    public void setDateTo(String date) {
        setDateInput(dateToInput, date);
    }

    public String getDateFromValue() {
        wait.until(ExpectedConditions.visibilityOf(dateFromInput));
        return dateFromInput.getAttribute("value");
    }

    public String getDateToValue() {
        wait.until(ExpectedConditions.visibilityOf(dateToInput));
        return dateToInput.getAttribute("value");
    }

    public void clickReset() {
        wait.until(ExpectedConditions.elementToBeClickable(resetButton)).click();
        wait.until(driver -> getSearchValue().isEmpty()
                && getDateFromValue().isEmpty()
                && getDateToValue().isEmpty()
                && "dateDesc".equals(getSelectedSortValue()));
    }

    public void openCreateModal() {
        wait.until(ExpectedConditions.elementToBeClickable(newAppointmentButton)).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(MODAL));
    }

    public void closeCreateModal() {
        wait.until(ExpectedConditions.elementToBeClickable(modalCancelButton)).click();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(MODAL));
    }

    public String getModalHeadingText() {
        return wait.until(ExpectedConditions.visibilityOf(modalHeading)).getText();
    }

    public boolean isPatientDoctorSelectVisible() {
        return !driver.findElements(By.cssSelector(".modal-card select")).isEmpty()
                && driver.findElement(By.cssSelector(".modal-card select")).isDisplayed();
    }

    public boolean isDoctorPatientJmbgInputVisible() {
        return !driver.findElements(By.cssSelector(".modal-card input[placeholder='Unesite JMBG pacijenta']")).isEmpty()
                && driver.findElement(By.cssSelector(".modal-card input[placeholder='Unesite JMBG pacijenta']")).isDisplayed();
    }

    public boolean isModalDateInputVisible() {
        return !driver.findElements(By.cssSelector(".modal-card input[type='date']")).isEmpty()
                && driver.findElement(By.cssSelector(".modal-card input[type='date']")).isDisplayed();
    }

    public boolean isModalReasonTextareaVisible() {
        return !driver.findElements(By.cssSelector(".modal-card textarea")).isEmpty()
                && driver.findElement(By.cssSelector(".modal-card textarea")).isDisplayed();
    }

    public boolean hasEmptyState() {
        return !driver.findElements(EMPTY_STATE).isEmpty()
                && driver.findElement(EMPTY_STATE).isDisplayed();
    }

    public String getEmptyStateText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE)).getText();
    }

    public boolean hasErrorMessage() {
        return !driver.findElements(ERROR_MESSAGE).isEmpty()
                && driver.findElement(ERROR_MESSAGE).isDisplayed();
    }

    public void waitForPageToSettle() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(LOADING));
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(APPOINTMENT_CARDS, 0),
                ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    private void waitForStatusFilterResult(String status) {
        if (status.isEmpty()) {
            return;
        }

        String expectedStatus = statusText(status);
        wait.until(driver -> {
            List<WebElement> badges = driver.findElements(By.cssSelector(".appointment-card .status-badge"));
            if (badges.isEmpty()) {
                return hasEmptyState() || hasErrorMessage();
            }
            return badges.stream().allMatch(badge -> badge.getText().equals(expectedStatus));
        });
    }

    private void waitForSearchToApply(String searchTerm) {
        String normalized = searchTerm.toLowerCase();
        wait.until(driver -> {
            List<WebElement> cards = driver.findElements(APPOINTMENT_CARDS);
            if (cards.isEmpty()) {
                return hasEmptyState() || hasErrorMessage();
            }
            return cards.stream().allMatch(card -> card.getText().toLowerCase().contains(normalized));
        });
    }

    private void setDateInput(WebElement input, String date) {
        wait.until(ExpectedConditions.visibilityOf(input));
        js.executeScript(
                "arguments[0].value = arguments[1];" +
                        "arguments[0].dispatchEvent(new Event('input', { bubbles: true }));" +
                        "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
                input,
                date
        );
    }

    private String statusText(String status) {
        return switch (status) {
            case "scheduled" -> "Zakazan";
            case "completed" -> "Završen";
            case "canceled" -> "Otkazan";
            default -> status;
        };
    }
}
