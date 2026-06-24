package pmf.imi.moodle;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

public class NotificationsPage extends BasePageModel {
    public static final String NOTIFICATIONS_URL = BasePageModel.BASE_URL + "/notifications";

    @FindBy(css = ".notifications-page h1")
    private WebElement heading;

    @FindBy(css = ".page-head .badge")
    private WebElement unreadBadge;

    @FindBy(css = ".head-actions .btn-secondary")
    private WebElement markAllReadButton;

    @FindBy(css = ".head-actions .btn-danger")
    private WebElement clearAllButton;

    public NotificationsPage(WebDriver driver) {
        super(driver);
    }

    public String getHeadingText() {
        waitForPageToRender();
        return wait.until(ExpectedConditions.visibilityOf(heading)).getText();
    }

    public String getUnreadBadgeText() {
        waitForPageToRender();
        return wait.until(ExpectedConditions.visibilityOf(unreadBadge)).getText();
    }

    public String getMarkAllReadButtonText() {
        return wait.until(ExpectedConditions.visibilityOf(markAllReadButton)).getText();
    }

    public String getClearAllButtonText() {
        return wait.until(ExpectedConditions.visibilityOf(clearAllButton)).getText();
    }

    public int getNotificationCardsCount() {
        waitForPageToRender();
        return driver.findElements(By.cssSelector(".notification-card")).size();
    }

    public String getFirstNotificationCardText() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".notification-card")));
        return driver.findElements(By.cssSelector(".notification-card")).get(0).getText();
    }

    public boolean hasEmptyState() {
        return !driver.findElements(By.cssSelector(".empty-state")).isEmpty()
                && driver.findElement(By.cssSelector(".empty-state")).isDisplayed();
    }

    public String getEmptyStateText() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".empty-state"))).getText();
    }

    public void waitForPageToRender() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".notifications-page")));
        wait.until(driver -> {
            List<WebElement> cards = driver.findElements(By.cssSelector(".notification-card"));
            List<WebElement> empty = driver.findElements(By.cssSelector(".empty-state"));
            return !cards.isEmpty() || (!empty.isEmpty() && empty.get(0).isDisplayed());
        });
    }
}
