from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from apps.camps.views import UnifiedQRVerifyView

SITEMAP_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bloodchain.org/</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bloodchain.org/camps</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bloodchain.org/donor</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bloodchain.org/verify</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bloodchain.org/hospital</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bloodchain.org/bloodbank</loc>
    <lastmod>2026-09-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""

def sitemap_view(request):
    return HttpResponse(SITEMAP_XML, content_type='application/xml')

def robots_view(request):
    return HttpResponse("User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n", content_type='text/plain')

urlpatterns = [
    path('sitemap.xml', sitemap_view, name='sitemap-xml'),
    path('robots.txt', robots_view, name='robots-txt'),
    path('admin/', admin.site.urls),
    path('api/verify/<str:token>/', UnifiedQRVerifyView.as_view(), name='unified-verify'),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/facilities/', include('apps.facilities.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/requests/', include('apps.requests.urls')),
    path('api/transfers/', include('apps.transfers.urls')),
    path('api/demand/', include('apps.demand.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/donors/', include('apps.donors.urls')),
    path('api/camps/', include('apps.camps.urls')),
]
