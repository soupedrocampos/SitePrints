from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import subprocess
import asyncio
import uuid
import time
from datetime import datetime
from business_checker import BusinessChecker
from dotenv import load_dotenv
import requests

load_dotenv()

app = FastAPI()

# Configuração de CORS para permitir o frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class Business(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    type: str
    place_id: Optional[str] = None
    source: Optional[str] = "Google Maps"
    city: Optional[str] = ""
    state: Optional[str] = ""

class SearchRequest(BaseModel):
    query: str
    location: str
    radius: int = 5
    useFreeScraper: bool = False

class MassSearchRequest(BaseModel):
    queries: List[str]
    location: str
    radius: int = 5
    useFreeScraper: bool = False

class AnalysisRequest(BaseModel):
    url: str
    business_name: str

# Instância do Checker
checker = BusinessChecker()

def run_free_scraper(query: str, location: str) -> List[Business]:
    """Executa o scraper gratuito (executável) e retorna os resultados"""
    scraper_path = os.path.join(os.getcwd(), "google-maps-scraper.exe")
    if not os.path.exists(scraper_path):
        print(f"Erro: Scraper não encontrado em {scraper_path}")
        return []

    full_query = f"{query} em {location}"
    output_file = f"results_{uuid.uuid4().hex}.json"
    
    try:
        # Comando para o scraper.exe (ajuste os argumentos se necessário)
        # Assumindo que o scraper aceita --query e --output
        process = subprocess.run(
            [scraper_path, "--query", full_query, "--limit", "20", "--output", output_file],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if process.returncode != 0:
            print(f"Erro no scraper: {process.stderr}")
            return []

        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            os.remove(output_file)
            
            # Converter formato do scraper para o modelo Business
            results = []
            for item in data:
                results.append(Business(
                    name=item.get('title', 'N/A'),
                    address=item.get('address', 'N/A'),
                    phone=item.get('phone'),
                    website=item.get('website'),
                    rating=item.get('rating'),
                    type=query,
                    source="Raspador Gratuito"
                ))
            return results

    except Exception as e:
        print(f"Exceção ao rodar scraper: {str(e)}")
    
    return []

def process_search(query: str, location: str, radius: int) -> List[Business]:
    """Processa a busca usando SerpApi (ou Google Places como fallback)"""
    # Exemplo simples com Google Places API (requer chave GCP)
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return []

    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}+em+{location}&key={api_key}"
    response = requests.get(url)
    data = response.json()
    
    results = []
    for place in data.get('results', []):
        results.append(Business(
            name=place.get('name'),
            address=place.get('formatted_address'),
            rating=place.get('rating'),
            type=query,
            place_id=place.get('place_id'),
            source="Google Maps API"
        ))
    return results

@app.post("/api/search")
async def search(request: SearchRequest):
    if request.useFreeScraper:
        results = run_free_scraper(request.query, request.location)
    else:
        results = process_search(request.query, request.location, request.radius)
    return results

@app.post("/api/mass-search")
async def mass_search(request: MassSearchRequest):
    all_results = []
    for query in request.queries:
        if request.useFreeScraper:
            results = run_free_scraper(query, request.location)
        else:
            results = process_search(query, request.location, request.radius)
        all_results.extend(results)
    return all_results

@app.post("/api/analyze")
async def analyze(request: AnalysisRequest):
    result = await checker.analyze_full(request.url, request.business_name)
    return result

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
