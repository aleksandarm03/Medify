package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;
import java.util.stream.Collectors;

public class PrescriptionsPage extends BasePageModel {
    public static final String PRESCRIPTIONS_URL = BasePageModel.BASE_URL + "/prescriptions";

    private static final By PRESCRIPTION_CARDS = By.cssSelector(".prescription-card");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");
    private static final By CREATE_MODAL = By.cssSelector(".modal-content");

    @FindBy(css = ".prescriptions-container h1")
    private WebElement heading;

    @FindBy(css = ".header .btn-primary")
    private WebElement newPrescriptionButton;

    @FindBy(id = "prescription-status")
    private WebElement statusFilter;

    @FindBy(css = ".filters .filter-input[type='text']")
    private WebElement searchInput;

    @FindBy(css = ".filters .filter-input[type='date'][aria-label='Od datuma']")
    private WebElement dateFromInput;

    @FindBy(css = ".filters .filter-input[type='date'][aria-label='Do datuma']")
    private WebElement dateToInput;

    @FindBy(css = ".filters select:not(#prescription-status)")
    private WebElement sortSelect;

    @FindBy(css = ".filters .btn-secondary")
    private WebElement resetButton;

    public PrescriptionsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public boolean isNewPrescriptionButtonVisible() {
        return !driver.findElements(By.cssSelector(".header .btn-primary")).isEmpty()
                && driver.findElement(By.cssSelector(".header .btn-primary")).isDisplayed();
    }

    public List<String> getStatusFilterOptions() {
        wait.until(ExpectedConditions.visibilityOf(statusFilter));
        return new Select(statusFilter).getOptions().stream().map(WebElement::getText).collect(Collectors.toList());
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

    public List<String> getSortOptions() {
        wait.until(ExpectedConditions.visibilityOf(sortSelect));
        return new Select(sortSelect).getOptions().stream().map(WebElement::getText).collect(Collectors.toList());
    }

    public String getSelectedSortValue() {
        wait.until(ExpectedConditions.visibilityOf(sortSelect));
        return new Select(sortSelect).getFirstSelectedOption().getAttribute("value");
    }

    public void selectSort(String value) {
        wait.until(ExpectedConditions.elementToBeClickable(sortSelect));
        new Select(sortSelect).selectByValue(value);
    }

    public int getPrescriptionCardsCount() {
        waitForPageToSettle();
        return driver.findElements(PRESCRIPTION_CARDS).size();
    }

    public String getFirstPrescriptionCardText() {
        waitForPageToSettle();
        return driver.findElements(PRESCRIPTION_CARDS).get(0).getText();
    }

    public List<String> getVisibleStatusTexts() {
        waitForPageToSettle();
        return driver.findElements(By.cssSelector(".prescription-card .status-badge"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getVisibleStatusClasses() {
        waitForPageToSettle();
        return driver.findElements(By.cssSelector(".prescription-card .status-badge"))
                .stream()
                .map(element -> element.getAttribute("class"))
                .collect(Collectors.toList());
    }

    public void setSearchTerm(String value) {
        wait.until(ExpectedConditions.visibilityOf(searchInput));
        searchInput.clear();
        searchInput.sendKeys(value);
        wait.until(driver -> getSearchValue().equals(value));
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
                && "issueDateDesc".equals(getSelectedSortValue()));
    }

    public void openCreateModal() {
        wait.until(ExpectedConditions.elementToBeClickable(newPrescriptionButton)).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(CREATE_MODAL));
    }

    public void closeCreateModal() {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".modal-content .modal-actions .btn-secondary"))).click();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(CREATE_MODAL));
    }

    public String getCreateModalText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(CREATE_MODAL)).getText();
    }

    public boolean hasEmptyState() {
        return !driver.findElements(EMPTY_STATE).isEmpty() && driver.findElement(EMPTY_STATE).isDisplayed();
    }

    public String getEmptyStateText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE)).getText();
    }

    public boolean hasErrorMessage() {
        return !driver.findElements(ERROR_MESSAGE).isEmpty() && driver.findElement(ERROR_MESSAGE).isDisplayed();
    }

    public void waitForPageToSettle() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(LOADING));
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(PRESCRIPTION_CARDS, 0),
                ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    private void waitForStatusFilterResult(String status) {
        if (status.isEmpty()) {
            return;
        }
        String expected = statusText(status);
        wait.until(driver -> {
            List<WebElement> badges = driver.findElements(By.cssSelector(".prescription-card .status-badge"));
            if (badges.isEmpty()) {
                return hasEmptyState() || hasErrorMessage();
            }
            return badges.stream().allMatch(badge -> badge.getText().equals(expected));
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
            case "active" -> "Aktivan";
            case "completed" -> "Završen";
            case "cancelled" -> "Otkazan";
            default -> status;
        };
    }
}
