import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

URL = "https://www.armaanalytics.com/post/beyond-the-trophy-what-the-2026-world-cup-actually-taught-us"

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920,1080")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

while True:
    driver = None
    try:
        driver = webdriver.Chrome(options=options)

        driver.get(URL)

        # Wait for page to load
        time.sleep(0.1)

        # Scroll down slowly
        page_height = driver.execute_script("return document.body.scrollHeight")
        current = 0
        step = 300

        while current < page_height:
            driver.execute_script(f"window.scrollTo(0, {current});")
            time.sleep(0.1)
            current += step

        # Scroll back to top
        while current > 0:
            current -= step
            driver.execute_script(f"window.scrollTo(0, {current});")
            time.sleep(0.1)

        # Stay on page
        time.sleep(0.1)

        print("Completed one iteration")

    except Exception as e:
        print(e)

    finally:
        if driver:
            driver.quit()

    # Short pause before next iteration
    time.sleep(0.1)