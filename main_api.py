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
from fastapi.staticfiles import StaticFiles
from business_checker import BusinessChecker
from typing import List

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

class AnalysisRequest(BaseModel):
    id: str
    businessName: str
    website: str


class AnalysisBatchRequest(BaseModel):
    sites: List[AnalysisRequest]


class BusinessLink(BaseModel):
    label: str
    url: str


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


@app.get("/api/search/businesses")
async def search_businesses(
    query: str = Query(...),
    location: str = Query(...),
    radius: int = 5,
    use_serp: bool = True
):
    logger.info(f"Search Request: query='{query}', location='{location}', radius={radius}")
    results = []

    # --- Try SerpApi first ---
    if use_serp and SERP_API_KEY:
        try:
            logger.info("Trying SerpApi Google Maps engine: Fetching maximum possible results...")
            
            start_index = 0
            while True:
                search = GoogleSearch({
                    "engine": "google_maps",
                    "q": f"{query} em {location}",
                    "hl": "pt",
                    "api_key": SERP_API_KEY,
                    "start": start_index
                })
                serp_results = search.get_dict()
                local_results = serp_results.get("local_results", [])
                logger.info(f"SerpApi returned {len(local_results)} results for start={start_index}")
                
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
                    
                    # Capture extra links from SerpApi (Menu, Order, etc)
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
                
                # If we got less than 20 results, it means there are no more pages
                if len(local_results) < 20:
                    break
                start_index += 20
                    
        except Exception as e:
            logger.error(f"SerpApi Error: {e}")

    # --- Fallback to Google Places API ---
    if not results:
        try:
            logger.info("Falling back to Google Places API...")
            geocode = gmaps.geocode(location)
            if not geocode:
                logger.warning(f"Cannot geocode location: {location}")
                return {"results": [], "total": 0, "sessionId": str(uuid.uuid4())}

            loc = geocode[0]["geometry"]["location"]
            address_components = geocode[0].get("address_components", [])
            city_part = next((c["long_name"] for c in address_components if "locality" in c["types"]), location.split(",")[0].strip())
            state_part = next((c["short_name"] for c in address_components if "administrative_area_level_1" in c["types"]), "")

            places_result = gmaps.places(query=query, location=loc, radius=radius * 1000, language="pt-BR")
            places_list = places_result.get("results", [])
            logger.info(f"Google Places returned {len(places_list)} results")

            for place in places_list:
                results.append(Business(
                    place_id=place.get("place_id", str(uuid.uuid4())),
                    name=place.get("name", ""),
                    address=place.get("formatted_address", ""),
                    rating=place.get("rating"),
                    reviewCount=place.get("user_ratings_total", 0),
                    type=place.get("types", ["Serviços"])[0].replace("_", " ").title() if place.get("types") else "Serviços",
                    source="Google Places",
                    city=city_part,
                    state=state_part,
                ))
        except Exception as e:
            logger.error(f"Google Places Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Total results: {len(results)}")
    return {"results": results, "total": len(results), "sessionId": str(uuid.uuid4())}


@app.post("/api/analyze/site")
async def analyze_site(req: AnalysisRequest):
    logger.info(f"Analyzing site: {req.businessName} ({req.website})")
    try:
        # Check accessibility and performance
        web_check = checker.check_website(req.website)
        
        # Take screenshot if accessible
        screenshot_path = None
        if web_check['accessible']:
            screenshot_path = checker.take_screenshot(req.website, output_folder=SCREENSHOTS_DIR)
            if screenshot_path:
                # Convert system path to URL path
                screenshot_path = f"/screenshots/{os.path.basename(screenshot_path)}"

        # Mock quality analysis for now (later can use Gemini)
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


@app.post("/api/analyze/batch")
async def analyze_batch(req: AnalysisBatchRequest):
    # For now, process sequentially, but could use asyncio.gather
    results = []
    for site in req.sites:
        res = await analyze_site(site)
        results.append(res)
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
