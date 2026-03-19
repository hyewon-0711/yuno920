import httpx
from fastapi import APIRouter, Query
from app.models.schemas import WeatherResponse, MealResponse

router = APIRouter()

WEATHER_ICONS = {
    "Clear": "☀️", "Clouds": "☁️", "Rain": "🌧️", "Snow": "🌨️",
    "Drizzle": "🌦️", "Thunderstorm": "⛈️", "Mist": "🌫️", "Fog": "🌫️",
}

WEATHER_KO = {
    "Clear": "맑음", "Clouds": "흐림", "Rain": "비", "Snow": "눈",
    "Drizzle": "이슬비", "Thunderstorm": "천둥번개", "Mist": "안개", "Fog": "안개",
}


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(default=37.5665, description="위도"),
    lon: float = Query(default=126.9780, description="경도"),
):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current_weather": True,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        cw = data.get("current_weather", {})
        temp = cw.get("temperature", 0)

        wmo_code = cw.get("weathercode", 0)
        if wmo_code == 0:
            condition, icon = "맑음", "☀️"
        elif wmo_code in (1, 2, 3):
            condition, icon = "구름", "⛅"
        elif wmo_code in (45, 48):
            condition, icon = "안개", "🌫️"
        elif wmo_code in (51, 53, 55, 61, 63, 65, 80, 81, 82):
            condition, icon = "비", "🌧️"
        elif wmo_code in (71, 73, 75, 77, 85, 86):
            condition, icon = "눈", "🌨️"
        elif wmo_code in (95, 96, 99):
            condition, icon = "천둥번개", "⛈️"
        else:
            condition, icon = "흐림", "☁️"

        return WeatherResponse(temperature=temp, description=condition, icon=icon)

    except Exception:
        return WeatherResponse(temperature=18.0, description="날씨 정보 없음", icon="❓")


@router.get("/meal", response_model=MealResponse)
async def get_meal(
    school_code: str = Query(default="", description="학교 코드 (NEIS)"),
    date: str = Query(default="", description="날짜 (YYYYMMDD)"),
):
    if not school_code or not date:
        return MealResponse(date=date, menu=["학교 코드를 등록하면 급식 메뉴를 확인할 수 있어요"])

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://open.neis.go.kr/hub/mealServiceDietInfo",
                params={
                    "Type": "json",
                    "ATPT_OFCDC_SC_CODE": school_code[:3],
                    "SD_SCHUL_CODE": school_code,
                    "MLSV_YMD": date,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        rows = data.get("mealServiceDietInfo", [{}])
        if len(rows) >= 2:
            meals = rows[1].get("row", [])
            if meals:
                menu_raw = meals[0].get("DDISH_NM", "")
                menu_list = [item.strip().split("(")[0].strip() for item in menu_raw.split("<br/>") if item.strip()]
                return MealResponse(date=date, menu=menu_list)

        return MealResponse(date=date, menu=["급식 정보가 없습니다"])

    except Exception:
        return MealResponse(date=date, menu=["급식 정보를 불러올 수 없습니다"])
