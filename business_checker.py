import requests
import asyncio
from playwright.async_api import async_playwright
import os
import time

class BusinessChecker:
    def __init__(self):
        self.screenshot_dir = "screenshots"
        if not os.path.exists(self.screenshot_dir):
            os.makedirs(self.screenshot_dir)

    async def check_website(self, url: str):
        """Verifica se o site está online e tempo de resposta"""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10)
            response_time = (time.time() - start_time) * 1000
            return {
                "status": "online" if response.status_code == 200 else "error",
                "code": response.status_code,
                "response_time": round(response_time, 2)
            }
        except Exception as e:
            return {"status": "offline", "error": str(e)}

    async def take_screenshot(self, url: str, filename: str):
        """Tira um screenshot do site usando Playwright"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            try:
                await page.goto(url, timeout=30000)
                path = os.path.join(self.screenshot_dir, f"{filename}.png")
                await page.screenshot(path=path, full_page=False)
                await browser.close()
                return path
            except Exception as e:
                await browser.close()
                return None

    async def analyze_full(self, url: str, name: str):
        """Job completo de análise"""
        site_info = await self.check_website(url)
        screenshot = None
        if site_info["status"] == "online":
            screenshot = await self.take_screenshot(url, name.replace(" ", "_"))
        
        return {
            "site_info": site_info,
            "screenshot": screenshot,
            "analysis_date": time.strftime("%Y-%m-%d %H:%M:%S")
        }
