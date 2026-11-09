export const providers = {
  earthquakes: {
    name: 'USGS',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
    docs: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',
    license: 'USGS public-domain data; retain attribution.',
    unit: 'magnitude; depth in km',
  },
  population: {
    name: 'World Bank',
    url: 'https://api.worldbank.org/v2/country/USA;CHN;IND;BRA;DEU;NGA/indicator/SP.POP.TOTL?format=json&per_page=1000',
    docs: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures',
    license: 'World Bank data attribution; consult dataset license.',
    unit: 'people',
  },
  growth: {
    name: 'World Bank',
    url: 'https://api.worldbank.org/v2/country/USA;CHN;IND;BRA;DEU;NGA/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=1000',
    docs: 'https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures',
    license: 'World Bank data attribution; consult dataset license.',
    unit: 'annual %',
  },
  temperature: {
    name: 'Open-Meteo',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7&longitude=-74.0&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_days=2&timezone=America%2FNew_York&timeformat=unixtime',
    docs: 'https://open-meteo.com/en/docs',
    license: 'Open-Meteo weather data: CC BY 4.0 attribution.',
    unit: '°C',
  },
  precipitation: {
    name: 'Open-Meteo',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.7,51.5074,19.076,1.3521,-23.5505&longitude=-74.0,-0.1278,72.8777,103.8198,-46.6333&hourly=precipitation&forecast_days=2&timezone=America%2FNew_York&timeformat=unixtime',
    docs: 'https://open-meteo.com/en/docs',
    license: 'Open-Meteo weather data: CC BY 4.0 attribution.',
    unit: 'mm',
  },
  books: {
    name: 'Open Library',
    url: 'https://openlibrary.org/search.json?q=data+visualization&limit=70&fields=key,title,first_publish_year,edition_count,author_key,author_name,subject',
    docs: 'https://openlibrary.org/dev/docs/api/search',
    license: 'Open Library catalog data; retain attribution and original response.',
    unit: 'editions',
  },
  events: {
    name: 'NASA EONET',
    url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=60&limit=500',
    docs: 'https://eonet.gsfc.nasa.gov/docs/v3',
    license: 'NASA EONET attribution; upstream sources have their own terms.',
    unit: 'category memberships',
  },
};

providers.population.url += '&date=1980:' + new Date().getUTCFullYear();
