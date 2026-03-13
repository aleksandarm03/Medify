package pmf.imi.moodle;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class LoginPage extends BasePageModel {
    public static final String LOGIN_URL = BasePageModel.BASE_URL + "/login";

    @FindBy(id = "jmbg")
    private WebElement jmbgField;

    @FindBy(id = "password")
    private WebElement passwordField;

    @FindBy(css = "button[type='submit']")
    private WebElement submitButton;

    @FindBy(css = ".error-message")
    private WebElement errorMessage;

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    /**
     * Unosi JMBG u polje za korisničko ime.
     */
    public void setUsername(String jmbg) {
        wait.until(ExpectedConditions.visibilityOf(jmbgField));
        jmbgField.clear();
        jmbgField.sendKeys(jmbg);
    }

    /**
     * Unosi lozinku u odgovarajuće polje.
     */
    public void setPassword(String password) {
        wait.until(ExpectedConditions.visibilityOf(passwordField));
        passwordField.clear();
        passwordField.sendKeys(password);
    }

    /**
     * Klik na dugme "Prijavi se".
     */
    public void clickSubmit() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton)).click();
    }

    /**
     * Vraća tekst poruke o grešci (ako postoji).
     */
    public String getErrorMessage() {
        wait.until(ExpectedConditions.visibilityOf(errorMessage));
        return errorMessage.getText();
    }

    /**
     * Vraća naslov stranice (title tag).
     */
    public String getTitle() {
        return driver.getTitle();
    }

    /**
     * Helpera metoda – popunjava oba polja i šalje formu u jednom pozivu.
     */
    public void login(String jmbg, String password) {
        setUsername(jmbg);
        setPassword(password);
        clickSubmit();
        wait.until(ExpectedConditions.not(ExpectedConditions.urlToBe(LOGIN_URL)));
    }
}
