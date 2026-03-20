from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from serpapi import GoogleSearch
import googlemaps
from datetime import datetime
import uuid
import logging
import csv
from fastapi.staticfiles import StaticFiles
from business_checker import BusinessChecker, is_generic_site
from typing import List
import asyncio

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Business Finder API")

# Ensure screenshots directory exists
SCREENSHOTS_DIR = "screenshots"
if not os.path.exists(SCREENSHOTS_DIR):
    os.makedirs(SCREENSHOTS_DIR)

# Mount screenshots directory to serve images
app.mount("/screenshots", StaticFiles(directory=SCREENSHOTS_DIR), name="screenshots")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GOOGLE_API_KEY = "AIzaSyBG4ljWqlnLlrcW6FdSs-vGn6tu9gKV4G8"
SERP_API_KEY = "e2593451d5a5061bc5b9610635460ff0f21e0c0a607cfa0b5a900c41432e4e76"

gmaps = googlemaps.Client(key=GOOGLE_API_KEY)
checker = BusinessChecker(google_api_key=GOOGLE_API_KEY)

SOCIAL_PLATFORMS = ["instagram.com", "facebook.com", "linktr.ee", "wa.me", "linkedin.com", "twitter.com", "youtube.com"]

def identify_link_type(url: str, label: str) -> str:
    if not url: return label
    lower_url = url.lower()
    for platform in SOCIAL_PLATFORMS:
        if platform in lower_url:
            name = platform.split(".")[0].capitalize()
            if name == "Wa": return "WhatsApp"
            if name == "Linktr": return "Linktree"
            return name
    return label


# --- Models ---

class MassSearchRequest(BaseModel):
    location: str
    categories: List[str]
    limit_per_category: int = 20
    useFreeScraper: bool = False
    lat_lng: Optional[str] = None
    zoom: Optional[int] = 14

class AnalysisRequest(BaseModel):
    id: str
    businessName: str
    website: str


class AnalysisBatchRequest(BaseModel):
    sites: List[AnalysisRequest]


class BusinessLink(BaseModel):
    label: str
    url: str


async def run_free_scraper(queries: List[str], depth: int = 2) -> List['Business']:
    uid = str(uuid.uuid4())
    input_file = f"temp_queries_{uid}.txt"
    output_file = f"temp_results_{uid}.csv"
    
    # Use environment variable for portability, fallback to default relative path
    default_scraper_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "google-maps-scraper-main")
    scraper_dir = os.getenv("SCRAPER_DIR", default_scraper_dir)
    scraper_exe = os.path.join(scraper_dir, "google-maps-scraper.exe")
    
    if not os.path.exists(scraper_exe):
        logger.error(f"Free scraper exe NOT FOUND at: {scraper_exe}")
        return []

    logger.info(f"Running free scraper (depth={depth}) for queries: {queries}")
    
    # Write queries
    input_path = os.path.join(scraper_dir, input_file)
    with open(input_path, "w", encoding="utf-8") as f:
        for q in queries:
            f.write(q + "\n")
            
    # Run executable
    try:
        process = await asyncio.create_subprocess_exec(
            scraper_exe,
            "-input", input_file,
            "-results", output_file,
            "-lang", "pt-BR",
            "-depth", str(depth),
            cwd=scraper_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Add timeout to prevent hanging processes
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=300)
            if process.returncode != 0:
                logger.error(f"Scraper error (code {process.returncode}): {stderr.decode() if stderr else 'Unknown error'}")
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            logger.error("Scraper subprocess timed out after 300 seconds")
            
    except Exception as e:
        logger.error(f"Failed to execute free scraper: {e}")
        
    results = []
    output_path = os.path.join(scraper_dir, output_file)
    if os.path.exists(output_path):
        with open(output_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                city_part = row.get("address", "").split(",")[0] if row.get("address") else ""
                
                rating_str = row.get("review_rating", "0")
                review_count_str = row.get("review_count", "0")
                try: 
                    rating = float(rating_str) if rating_str else None
                except (ValueError, TypeError): 
                    rating = None
                try: 
                    review_count = int(review_count_str) if review_count_str else 0
                except (ValueError, TypeError): 
                    review_count = 0
                
                links = []
                if row.get("website"):
                    links.append(BusinessLink(label=identify_link_type(row.get("website"), "Website"), url=row.get("website")))
                
                results.append(Business(
                    place_id=row.get("place_id") or str(uuid.uuid4()),
                    name=row.get("title", ""),
                    address=row.get("address", ""),
                    phone=row.get("phone", ""),
                    rating=rating,
                    reviewCount=review_count,
                    website=row.get("website") or None,
                    type=row.get("category", "Serviços"),
                    source="Raspador Gratuito",
                    city=city_part,
                    links=links
                ))
                
    # Cleanup files
    try:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)
    except:
        pass
        
    logger.info(f"Free scraper returned {len(results)} results")
    return results


# Shape aligned with frontend Business interface
class Business(BaseModel):
    place_id: str
    name: str
    address: str
    phone: Optional[str] = None
    rating: Optional[float] = None
    website: Optional[str] = None
    type: str = "Serviços"
    accessible: Optional[bool] = None
    response_time: Optional[int] = None
    status_code: Optional[int] = None
    screenshot: Optional[str] = None
    links: List[BusinessLink] = []
    # Extra metadata (ignored by frontend TS, useful for leads)
    source: str = "Google Maps"
    city: str = ""
    state: str = ""
    reviewCount: int = 0


async def process_search(query: str, location: str, radius: int = 5, use_serp: bool = True, lat_lng: Optional[str] = None, zoom: Optional[int] = 14):
    logger.info(f"Processing search: query='{query}', location='{location}', radius={radius}, lat_lng='{lat_lng}', zoom={zoom}")
    results = []

    # --- Try SerpApi first ---
    if use_serp and SERP_API_KEY:
        try:
            logger.info(f"Trying SerpApi for query: {query}")
            
            start_index = 0
            while True:
                params = {
                    "engine": "google_maps",
                    "q": query,
                    "api_key": SERP_API_KEY,
                    "hl": "pt",
                    "start": start_index
                }
                if lat_lng:
                    params["ll"] = lat_lng
                    params["z"] = zoom
                else:
                    params["location"] = location

                search = GoogleSearch(params)
                serp_results = search.get_dict()
                local_results = serp_results.get("local_results", [])
                
                if not local_results:
                    break

                for res in local_results:
                    city_part = location.split(",")[0].strip()
                    state_part = location.split(",")[-1].strip() if "," in location else ""
                    
                    # Extract all links
                    links = []
                    primary_website = res.get("website")
                    if primary_website:
                        links.append(BusinessLink(label=identify_link_type(primary_website, "Website"), url=primary_website))
                    
                    extra_links = res.get("links", [])
                    if isinstance(extra_links, list):
                        for el in extra_links:
                            url = el.get("link")
                            if url and url != primary_website:
                                label = el.get("text", "Link")
                                links.append(BusinessLink(label=identify_link_type(url, label), url=url))

                    results.append(Business(
                        place_id=res.get("place_id", str(uuid.uuid4())),
                        name=res.get("title", ""),
                        address=res.get("address", f"{city_part}, {state_part}"),
                        phone=res.get("phone"),
                        rating=res.get("rating"),
                        website=primary_website,
                        type=res.get("type", "Serviços"),
                        source="SerpApi (Google Maps)",
                        city=city_part,
                        state=state_part,
                        reviewCount=res.get("reviews", 0),
                        links=links
                    ))
                
                if len(local_results) < 20: # Should we maybe limit this for mass search?
                    break
                start_index += 20
                if start_index >= 60: # Limit to 3 pages per category to avoid burning credits
                    break
                    
        except Exception as e:
            logger.error(f"SerpApi Error: {e}")

    # --- Fallback to Google Places API ---
    if not results:
        try:
            logger.info(f"Falling back to Google Places API for query: {query}")
            
            # Resolve location
            if lat_lng:
                try:
                    lat, lng = map(float, lat_lng.split(","))
                    loc = {"lat": lat, "lng": lng}
                    city_part = location.split(",")[0].strip()
                    state_part = ""
                except Exception:
                    logger.error(f"Error parsing lat_lng: {lat_lng}")
                    return []
            else:
                geocode = gmaps.geocode(location)
                if not geocode:
                    return []
                loc = geocode[0]["geometry"]["location"]
                address_components = geocode[0].get("address_components", [])
                city_part = next((c["long_name"] for c in address_components if "locality" in c["types"]), location.split(",")[0].strip())
                state_part = next((c["short_name"] for c in address_components if "administrative_area_level_1" in c["types"]), "")

            places_result = gmaps.places(query=query, location=loc, radius=radius * 1000, language="pt-BR")
            places_list = places_result.get("results", [])

            # Fetch website for each place via Place Details (runs in parallel via thread pool)
            async def fetch_place_website(place_id: str):
                try:
                    details = await asyncio.to_thread(
                        gmaps.place, place_id=place_id, fields=["website", "formatted_phone_number"], language="pt-BR"
                    )
                    result = details.get("result", {})
                    return place_id, result.get("website"), result.get("formatted_phone_number")
                except Exception:
                    return place_id, None, None

            place_ids = [p.get("place_id") for p in places_list if p.get("place_id")]
            detail_results = await asyncio.gather(*[fetch_place_website(pid) for pid in place_ids])
            place_details_map = {pid: (website, phone) for pid, website, phone in detail_results if pid}

            for place in places_list:
                pid = place.get("place_id", str(uuid.uuid4()))
                website, phone = place_details_map.get(pid, (None, None))
                links = []
                if website:
                    links.append(BusinessLink(label=identify_link_type(website, "Website"), url=website))
                results.append(Business(
                    place_id=pid,
                    name=place.get("name", ""),
                    address=place.get("formatted_address", ""),
                    phone=phone,
                    rating=place.get("rating"),
                    reviewCount=place.get("user_ratings_total", 0),
                    website=website,
                    type=place.get("types", ["Serviços"])[0].replace("_", " ").title() if place.get("types") else "Serviços",
                    source="Google Places",
                    city=city_part,
                    state=state_part,
                    links=links,
                ))
        except Exception as e:
            logger.error(f"Google Places Error: {e}")

    return results


@app.get("/api/geocode")
async def geocode(address: str):
    try:
        results = gmaps.geocode(address)
        if not results:
            raise HTTPException(status_code=404, detail="Address not found")
        
        location = results[0]['geometry']['location']
        return {
            "lat": location['lat'],
            "lng": location['lng'],
            "formatted_address": results[0]['formatted_address']
        }
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search/businesses")
async def search_businesses(
    query: str = Query(...),
    location: str = Query(...),
    radius: int = 5,
    use_serp: bool = True,
    useFreeScraper: bool = False,
    ll: Optional[str] = None,
    zoom: int = 14
):
    if useFreeScraper:
        # Free scraper doesn't support 'll' directly in the same way, 
        # but we could construct a query with coordinates if needed.
        results = await run_free_scraper([f"{query} em {location}"], depth=1)
    else:
        results = await process_search(query, location, radius, use_serp, lat_lng=ll, zoom=zoom)
    return {"results": results, "total": len(results), "sessionId": str(uuid.uuid4())}


@app.get("/api/search/stream")
async def search_stream(
    location: str = Query(...),
    categories: str = Query(...),        # comma-separated list
    useFreeScraper: bool = Query(False),
    radius: int = Query(5),
    ll: Optional[str] = Query(None),
    zoom: int = Query(14)
):
    """
    SSE endpoint. Emits 'data: {...}\n\n' for each category as it completes.
    """
    from fastapi.responses import StreamingResponse
    import json

    category_list = [c.strip() for c in categories.split(",") if c.strip()]
    seen_ids: set = set()

    async def event_generator():
        for category in category_list:
            try:
                if useFreeScraper:
                    # In free scraper, we search specifically for "category in location"
                    results = await run_free_scraper([f"{category} em {location}"], depth=1)
                else:
                    results = await process_search(category, location, radius, True, lat_lng=ll, zoom=zoom)

                unique_results = []
                for r in results:
                    if r.place_id not in seen_ids:
                        seen_ids.add(r.place_id)
                        unique_results.append(r)

                event = {
                    "type": "results",
                    "category": category,
                    "results": [r.dict() for r in unique_results],
                    "total": len(seen_ids)
                }
                yield f"data: {json.dumps(event)}\n\n"

            except Exception as e:
                logger.error(f"Error in stream for category {category}: {e}")
                error_event = {"type": "error", "category": category, "message": str(e)}
                yield f"data: {json.dumps(error_event)}\n\n"

        done_event = {"type": "done", "totalUnique": len(seen_ids)}
        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@app.post("/api/mass-search")
async def mass_search(req: MassSearchRequest):
    logger.info(f"Mass Search Request: location='{req.location}', categories={len(req.categories)}, useFreeScraper={req.useFreeScraper}")
    all_results = []
    seen_place_ids = set()

    if getattr(req, "useFreeScraper", False):
        queries = [f"{category} em {req.location}" for category in req.categories]
        free_results = await run_free_scraper(queries, depth=2)
        for res in free_results:
            if res.place_id not in seen_place_ids:
                seen_place_ids.add(res.place_id)
                all_results.append(res)
    else:
        for idx, category in enumerate(req.categories):
            logger.info(f"Processing category {idx+1}/{len(req.categories)}: {category}")
            category_results = await process_search(
                category, 
                req.location, 
                radius=5, 
                use_serp=True, 
                lat_lng=req.lat_lng, 
                zoom=req.zoom
            )
            
            for res in category_results:
                if res.place_id not in seen_place_ids:
                    seen_place_ids.add(res.place_id)
                    all_results.append(res)
        
    logger.info(f"Mass search completed. Total unique results: {len(all_results)}")
    return {"results": all_results, "total": len(all_results), "sessionId": str(uuid.uuid4())}


@app.post("/api/analyze/site")
async def analyze_site(req: AnalysisRequest):
    logger.info(f"Analyzing site: {req.businessName} ({req.website})")
    
    # Check if site is generic (social media, linktree, etc.)
    if is_generic_site(req.website):
        return {
            "id": req.id,
            "businessName": req.businessName,
            "website": req.website,
            "status": "generic",
            "statusCode": 200,
            "responseTime": 0,
            "redirectCount": 0,
            "ssl": "valid" if req.website.startswith("https") else "missing",
            "screenshotUrl": None,
            "screenshotTimestamp": datetime.now().isoformat(),
            "quality": {
                "aestheticScore": 0,
                "mobileScore": 0,
                "brokenImages": 0,
                "hasMetaDescription": False
            },
            "rating": 4.5,
            "ratingCount": 120
        }

    try:
        # Check accessibility and performance
        # Note: check_website is still sync in BusinessChecker, but that's fine for now
        web_check = checker.check_website(req.website)
        
        # Take screenshot if accessible
        screenshot_path = None
        if web_check['accessible']:
            # Await the new async take_screenshot
            screenshot_path = await checker.take_screenshot(
                req.website, 
                output_folder=SCREENSHOTS_DIR,
                full_page=True,
                delay_ms=1500
            )
            if screenshot_path:
                # Convert system path to URL path
                screenshot_path = f"/screenshots/{os.path.basename(screenshot_path)}"

        # Mock quality analysis for now
        quality = {
            "aestheticScore": 85 if web_check['accessible'] else 0,
            "mobileScore": 78 if web_check['accessible'] else 0,
            "brokenImages": 0,
            "hasMetaDescription": True
        }

        # Status logic
        status = "ok"
        if not web_check['accessible']:
            status = "error"
        elif web_check['response_time'] > 3000:
            status = "warning"
        
        return {
            "id": req.id,
            "businessName": req.businessName,
            "website": req.website,
            "status": status,
            "statusCode": web_check['status_code'],
            "responseTime": web_check['response_time'],
            "redirectCount": web_check.get('redirect_count', 0),
            "ssl": "valid" if req.website.startswith("https") else "missing",
            "screenshotUrl": f"http://localhost:3002{screenshot_path}" if screenshot_path else None,
            "screenshotTimestamp": datetime.now().isoformat(),
            "quality": quality,
            "rating": 4.5,
            "ratingCount": 120
        }
    except Exception as e:
        logger.error(f"Analysis error for {req.website}: {e}")
        return {
            "id": req.id,
            "businessName": req.businessName,
            "website": req.website,
            "status": "error",
            "screenshotError": str(e),
            "screenshotTimestamp": datetime.now().isoformat(),
            "quality": {"aestheticScore": 0, "mobileScore": 0, "brokenImages": 0, "hasMetaDescription": False}
        }


# Limite de concorrência sugerido pelo usuário (5 browsers paralelos)
analysis_semaphore = asyncio.Semaphore(5)

@app.post("/api/analyze/batch")
async def analyze_batch(req: AnalysisBatchRequest):
    logger.info(f"Batch analysis request for {len(req.sites)} sites")
    
    async def limited_analysis(site):
        async with analysis_semaphore:
            return await analyze_site(site)
    
    # Processa todos em paralelo respeitando o limite do semáforo
    results = await asyncio.gather(*(limited_analysis(site) for site in req.sites))
    
    logger.info(f"Batch analysis completed for {len(results)} sites")
    return results


# --- Proxy: Google Places Autocomplete ---

@app.get("/api/places/autocomplete")
async def autocomplete(input: str, country: str = "BR"):
    try:
        res = gmaps.places_autocomplete(input=input, components={"country": country}, language="pt-BR")
        return [
            {
                "placeId": p["place_id"],
                "description": p["description"],
                "mainText": p["structured_formatting"]["main_text"],
                "secondaryText": p["structured_formatting"].get("secondary_text", ""),
            }
            for p in res
        ]
    except Exception as e:
        logger.error(f"Autocomplete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/places/details/{place_id}")
async def get_details(place_id: str):
    try:
        res = gmaps.place(place_id=place_id, language="pt-BR")
        result = res.get("result", {})
        return {
            "placeId": place_id,
            "name": result.get("name"),
            "formattedAddress": result.get("formatted_address"),
            "lat": result.get("geometry", {}).get("location", {}).get("lat"),
            "lng": result.get("geometry", {}).get("location", {}).get("lng"),
            "types": result.get("types", []),
            "phone": result.get("formatted_phone_number"),
            "website": result.get("website"),
            "rating": result.get("rating"),
            "userRatingsTotal": result.get("user_ratings_total"),
        }
    except Exception as e:
        logger.error(f"Details Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/places/geocode")
async def geocode(lat: float, lng: float):
    try:
        res = gmaps.reverse_geocode((lat, lng), language="pt-BR")
        return {"address": res[0]["formatted_address"] if res else ""}
    except Exception as e:
        logger.error(f"Geocode Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── WhatsApp Number Checker via Evolution API ───────────────────────────────

class WhatsAppCheckRequest(BaseModel):
    phones: List[str]

import re, requests as req_lib

EVOLUTION_URL      = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "")
EVOLUTION_KEY      = os.getenv("EVOLUTION_API_KEY", "")

@app.post("/api/check-whatsapp")
async def check_whatsapp(body: WhatsAppCheckRequest):
    """
    Verifies whether a list of phone numbers have active WhatsApp accounts.
    Requires Evolution API environment variables:
      EVOLUTION_API_URL  - e.g. http://localhost:8080
      EVOLUTION_INSTANCE - the instance name
      EVOLUTION_API_KEY  - the global API key
    """
    if not EVOLUTION_URL or not EVOLUTION_INSTANCE or not EVOLUTION_KEY:
        # Evolution API not configured — return unchecked for all
        return {"results": {p: "unchecked" for p in body.phones},
                "error": "Evolution API not configured"}

    results: dict[str, str] = {}
    for raw_phone in body.phones:
        phone = re.sub(r"\D", "", raw_phone)
        if not phone:
            results[raw_phone] = "invalid"
            continue
        # Ensure Brazil country code
        if not phone.startswith("55"):
            phone = "55" + phone
        try:
            url = f"{EVOLUTION_URL.rstrip('/')}/chat/whatsappNumbers/{EVOLUTION_INSTANCE}"
            resp = req_lib.post(
                url,
                json={"numbers": [phone]},
                headers={"apikey": EVOLUTION_KEY},
                timeout=10
            )
            data = resp.json()
            # Evolution API returns a list; each entry has 'exists' bool
            if isinstance(data, list) and data:
                entry = data[0]
                is_valid = entry.get("exists", False) or entry.get("numberExists", False)
                results[raw_phone] = "valid" if is_valid else "invalid"
            else:
                results[raw_phone] = "invalid"
        except Exception as e:
            logger.error(f"WhatsApp check error for {phone}: {e}")
            results[raw_phone] = "invalid"

    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
