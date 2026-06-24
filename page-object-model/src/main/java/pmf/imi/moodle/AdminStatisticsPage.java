package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;
import java.util.stream.Collectors;

public class AdminStatisticsPage extends BasePageModel {
    public static final String ADMIN_STATISTICS_URL = BasePageModel.BASE_URL + "/admin/statistics";

    private static final By STATS_CARDS = By.cssSelector(".stats-cards");
    private static final By TABLE_ROWS = By.cssSelector(".stats-table tbody tr");
    private static final By EMPTY_STATE = By.cssSelector(".empty-state");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");
    private static final By LOADING = By.cssSelector(".loading");

    @FindBy(css = ".admin-statistics-container h1")
    private WebElement heading;

    @FindBy(css = ".stat-card")
    private List<WebElement> statCards;

    @FindBy(css = ".stat-card .stat-label")
    private List<WebElement> statLabels;

    @FindBy(css = ".stat-card .stat-value")
    private List<WebElement> statValues;

    @FindBy(css = ".stats-table h2")
    private WebElement tableHeading;

    @FindBy(css = ".stats-table thead th")
    private List<WebElement> tableHeaders;

    public AdminStatisticsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToSettle();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public int getStatCardsCount() {
        waitForPageToSettle();
        wait.until(ExpectedConditions.visibilityOfAllElements(statCards));
        return statCards.size();
    }

    public List<String> getStatLabels() {
        waitForPageToSettle();
        return textOfVisibleElements(statLabels);
    }

    public List<String> getStatValues() {
        waitForPageToSettle();
        return textOfVisibleElements(statValues);
    }

    public String getTableHeadingText() {
        waitForTableToSettle();
        return wait.until(ExpectedConditions.visibilityOf(tableHeading)).getText();
    }

    public List<String> getTableHeaders() {
        waitForTableToSettle();
        return textOfVisibleElements(tableHeaders);
    }

    public int getRowsCount() {
        waitForTableToSettle();
        return driver.findElements(TABLE_ROWS).size();
    }

    public List<String> getFirstRowCells() {
        waitForTableToSettle();
        return driver.findElements(By.cssSelector(".stats-table tbody tr:first-child td"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getCompletionProgressTexts() {
        waitForTableToSettle();
        return driver.findElements(By.cssSelector(".stats-table tbody tr td:nth-child(6) .progress-text"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getCancellationProgressTexts() {
        waitForTableToSettle();
        return driver.findElements(By.cssSelector(".stats-table tbody tr td:nth-child(7) .progress-text"))
                .stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }

    public List<String> getCompletionProgressClasses() {
        waitForTableToSettle();
        return driver.findElements(By.cssSelector(".stats-table tbody tr td:nth-child(6) .progress-fill"))
                .stream()
                .map(element -> element.getAttribute("class"))
                .collect(Collectors.toList());
    }

    public List<String> getCancellationProgressClasses() {
        waitForTableToSettle();
        return driver.findElements(By.cssSelector(".stats-table tbody tr td:nth-child(7) .progress-fill"))
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
        wait.until(ExpectedConditions.or(
                ExpectedConditions.visibilityOfElementLocated(STATS_CARDS),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    private void waitForTableToSettle() {
        waitForPageToSettle();
        wait.until(ExpectedConditions.or(
                ExpectedConditions.numberOfElementsToBeMoreThan(TABLE_ROWS, 0),
                ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE),
                ExpectedConditions.visibilityOfElementLocated(ERROR_MESSAGE)
        ));
    }

    private List<String> textOfVisibleElements(List<WebElement> elements) {
        wait.until(ExpectedConditions.visibilityOfAllElements(elements));
        return elements.stream()
                .map(WebElement::getText)
                .collect(Collectors.toList());
    }
}
