package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;
import java.util.stream.Collectors;

public class AdminAppointmentsPage extends BasePageModel {
    public static final String ADMIN_APPOINTMENTS_URL = BasePageModel.BASE_URL + "/admin/appointments";

    private static final By TABLE_ROWS = By.cssSelector(".appointments-table tbody tr");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");

    @FindBy(css = ".admin-appointments-container h1")
    private WebElement heading;

    @FindBy(css = ".filters select")
    private WebElement statusFilter;

    @FindBy(css = ".appointments-table thead th")
    private List<WebElement> tableHeaders;

    public AdminAppointmentsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
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
        waitForRowsToMatchStatus(status);
    }

    public List<String> getTableHeaders() {
        waitForRowsToSettle();
        wait.until(ExpectedConditions.visibilityOfAllElements(tableHeaders));
        return tableHeaders.stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public int getRowsCount() {
        waitForRowsToSettle();
        return driver.findElements(TABLE_ROWS).size();
    }

    public String getFirstRowText() {
        waitForRowsToSettle();
        return driver.findElements(TABLE_ROWS).get(0).getText();
    }

    public List<String> getVisibleStatusTexts() {
        waitForRowsToSettle();
        return driver.findElements(By.cssSelector(".appointments-table tbody .status-badge"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getVisibleStatusClasses() {
        waitForRowsToSettle();
        return driver.findElements(By.cssSelector(".appointments-table tbody .status-badge"))
                .stream()
                .map(element -> element.getAttribute("class"))
                .collect(Collectors.toList());
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
        waitForRowsToSettle();
    }

    private void waitForRowsToSettle() {
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(TABLE_ROWS, 0),
                ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    private void waitForRowsToMatchStatus(String status) {
        wait.until(driver -> {
            try {
                List<WebElement> rows = driver.findElements(TABLE_ROWS);
                if (rows.isEmpty()) {
                    return isElementVisible(EMPTY_STATE) || isElementVisible(ERROR_MESSAGE);
                }

                String expectedText = statusText(status);
                return rows.stream().allMatch(row -> row.getText().contains(expectedText));
            } catch (StaleElementReferenceException ignored) {
                return false;
            }
        });
    }

    private boolean isElementVisible(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
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
