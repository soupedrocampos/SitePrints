import os
import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import json
import requests
import googlemaps
import time
import urllib.parse

class BusinessChecker:
    def __init__(self, google_api_key=None):
        """
        Inicializa o checker. A chave do Google é opcional se for usar apenas screenshots.
        """
        self.google_api_key = google_api_key
        self.gmaps = googlemaps.Client(key=google_api_key) if google_api_key else None
        self.results = []
    
    def search_businesses(self, keyword, location="", radius=5000):
        """
        Busca empresas usando a API do Google Places
        
        Args:
            keyword: Palavra-chave para busca
            location: Localização (ex: "São Paulo, Brasil")
            radius: Raio de busca em metros
        """
        print(f"Buscando empresas com palavra-chave: {keyword}")
        
        try:
            # Se location for fornecido, primeiro geocodifica
            if location:
                geocode_result = self.gmaps.geocode(location)
                if geocode_result:
                    lat = geocode_result[0]['geometry']['location']['lat']
                    lng = geocode_result[0]['geometry']['location']['lng']
                    location_coords = f"{lat},{lng}"
                else:
                    print(f"Não foi possível geocodificar: {location}")
                    return []
            
            # Busca por texto
            places_result = self.gmaps.places(query=keyword, location=location if location else None)
            
            businesses = []
            for place in places_result.get('results', []):
                place_id = place['place_id']
                
                # Obtém detalhes completos do lugar
                details = self.gmaps.place(place_id=place_id, fields=[
                    'name', 'website', 'formatted_address', 'rating', 
                    'formatted_phone_number', 'place_id'
                ])
                
                business_info = details.get('result', {})
                if business_info.get('website'):
                    businesses.append({
                        'name': business_info.get('name'),
                        'website': business_info.get('website'),
                        'address': business_info.get('formatted_address'),
                        'phone': business_info.get('formatted_phone_number'),
                        'rating': business_info.get('rating'),
                        'place_id': place_id
                    })
            
            print(f"Encontradas {len(businesses)} empresas com websites")
            return businesses
            
        except Exception as e:
            print(f"Erro ao buscar empresas: {e}")
            return []
    
    def check_website(self, url, timeout=10):
        """
        Verifica se o site está acessível e mede o tempo de resposta
        
        Args:
            url: URL do website
            timeout: Tempo limite para requisição
        """
        result = {
            'url': url,
            'accessible': False,
            'status_code': None,
            'response_time': None,
            'redirect_count': 0,
            'final_url': url,
            'error': None
        }
        
        try:
            start_time = time.time()
            response = requests.get(url, timeout=timeout, allow_redirects=True)
            end_time = time.time()
            
            result['accessible'] = response.status_code == 200
            result['status_code'] = response.status_code
            result['response_time'] = round((end_time - start_time) * 1000, 2)  # em ms
            result['redirect_count'] = len(response.history)
            result['final_url'] = response.url
            
        except requests.exceptions.Timeout:
            result['error'] = 'Timeout'
        except requests.exceptions.ConnectionError:
            result['error'] = 'Connection Error'
        except requests.exceptions.TooManyRedirects:
            result['error'] = 'Too Many Redirects'
        except Exception as e:
            result['error'] = str(e)
        
        return result
    
    async def take_screenshot(self, url, output_folder='screenshots', full_page=True, delay_ms=1500):
        """
        Tira um screenshot da página usando Playwright Assíncrono
        
        Args:
            url: URL do website
            output_folder: Pasta para salvar screenshots
            full_page: Se deve tirar o print da página inteira
            delay_ms: Delay antes do print (evitar bloqueio/esperar JS)
        """
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        try:
            url_with_scheme = url if url.startswith(('http://', 'https://')) else f"https://{url}"
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={'width': 1280, 'height': 800},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )
                
                page = await context.new_page()
                
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = os.path.join(output_folder, f"screenshot_{timestamp}.png")
                
                try:
                    # Navigation: domcontentloaded é mais rápido que networkidle
                    await page.goto(url_with_scheme, wait_until="domcontentloaded", timeout=30000)
                    
                    # Delay sugerido pelo usuário
                    if delay_ms > 0:
                        await asyncio.sleep(delay_ms / 1000)
                    
                    await page.screenshot(path=filename, full_page=full_page)
                    print(f"✅ Screenshot salvo: {filename}")
                except Exception as e:
                    print(f"❌ Erro ao capturar {url}: {e}")
                    await browser.close()
                    return None
                
                await browser.close()
                return filename
            
        except Exception as e:
            print(f"❌ Erro crítico Playwright ({url}): {e}")
            return None
    
    def analyze_businesses(self, businesses):
        """
        Analisa cada empresa: verifica site, performance e tira screenshot
        """
        results = []
        
        for idx, business in enumerate(businesses, 1):
            print(f"\n[{idx}/{len(businesses)}] Analisando: {business['name']}")
            print(f"Website: {business['website']}")
            
            # Verifica o website
            web_check = self.check_website(business['website'])
            
            result = {
                **business,
                'check_result': web_check,
                'screenshot': None,
                'checked_at': datetime.now().isoformat()
            }
            
            # Se o site está acessível, tira screenshot
            if web_check['accessible']:
                print(f"✓ Site acessível (Status: {web_check['status_code']}, "
                      f"Tempo: {web_check['response_time']}ms)")
                screenshot_path = self.take_screenshot(business['website'])
                result['screenshot'] = screenshot_path
            else:
                print(f"✗ Site com erro: {web_check['error'] or web_check['status_code']}")
            
            results.append(result)
            
            # Pequena pausa para não sobrecarregar
            time.sleep(1)
        
        return results
    
    def save_results(self, results, filename='results.json'):
        """
        Salva os resultados em um arquivo JSON
        """
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\nResultados salvos em: {filename}")
    
    def generate_report(self, results):
        """
        Gera um relatório resumido
        """
        total = len(results)
        accessible = sum(1 for r in results if r['check_result']['accessible'])
        with_errors = total - accessible
        
        avg_response_time = 0
        if accessible > 0:
            times = [r['check_result']['response_time'] 
                    for r in results if r['check_result']['response_time']]
            avg_response_time = sum(times) / len(times) if times else 0
        
        print("\n" + "="*50)
        print("RELATÓRIO DE ANÁLISE")
        print("="*50)
        print(f"Total de empresas analisadas: {total}")
        print(f"Sites acessíveis: {accessible} ({accessible/total*100:.1f}%)")
        print(f"Sites com erro: {with_errors} ({with_errors/total*100:.1f}%)")
        print(f"Tempo médio de resposta: {avg_response_time:.2f}ms")
        print("="*50)


# Exemplo de uso
def main():
    # CONFIGURE SUA CHAVE DA API DO GOOGLE PLACES AQUI
    GOOGLE_API_KEY = "AIzaSyBG4ljWqlnLlrcW6FdSs-vGn6tu9gKV4G8"
    
    # Inicializa o checker
    checker = BusinessChecker(GOOGLE_API_KEY)
    
    # Define palavras-chave para busca
    keywords = ["restaurante italiano são paulo", "hotel rio de janeiro"]
    
    all_results = []
    
    for keyword in keywords:
        # Busca empresas
        businesses = checker.search_businesses(keyword, location="Brasil")
        
        # Limita a 5 empresas por palavra-chave (ajuste conforme necessário)
        businesses = businesses[:5]
        
        if businesses:
            # Analisa cada empresa
            results = checker.analyze_businesses(businesses)
            all_results.extend(results)
    
    # Salva resultados
    if all_results:
        checker.save_results(all_results)
        checker.generate_report(all_results)


if __name__ == "__main__":
    main()
