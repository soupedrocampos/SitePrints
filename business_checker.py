import googlemaps
import requests
import time
import urllib.parse
from datetime import datetime
import json
import os

class BusinessChecker:
    def __init__(self, google_api_key):
        """
        Inicializa o checker com a chave da API do Google Places
        """
        self.gmaps = googlemaps.Client(key=google_api_key)
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
    
    def take_screenshot(self, url, output_folder='screenshots'):
        """
        Tira um screenshot da página
        
        Args:
            url: URL do website
            output_folder: Pasta para salvar screenshots
        """
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        
        try:
            # Format the URL
            url_with_scheme = url if url.startswith(('http://', 'https://')) else f"https://{url}"
            
            # Use Microlink API instead of local headless Chrome
            encoded_url = urllib.parse.quote(url_with_scheme, safe='')
            api_url = f"https://api.microlink.io/?url={encoded_url}&screenshot=true&meta=false"
            
            # Timeout set to 20s for the API call
            response = requests.get(api_url, timeout=20)
            response.raise_for_status()
            data = response.json()
            
            ss_url = data.get('data', {}).get('screenshot', {}).get('url')
            if not ss_url:
                print(f"Microlink não retornou um screenshot para {url}")
                return None
                
            # Download the actual image
            img_response = requests.get(ss_url, timeout=15)
            img_response.raise_for_status()
            
            # Gera nome do arquivo
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = os.path.join(output_folder, f"screenshot_{timestamp}.png")
            
            with open(filename, 'wb') as f:
                f.write(img_response.content)
            
            print(f"Screenshot salvo: {filename}")
            return filename
            
        except Exception as e:
            print(f"Erro ao tirar screenshot de {url} com Microlink: {e}")
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
