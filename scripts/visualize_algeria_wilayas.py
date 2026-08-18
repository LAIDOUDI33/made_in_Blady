#!/usr/bin/env python3
"""
Algeria Wilayas Data Visualization Suite
=========================================
Creates professional charts and visualizations for all 58 Algerian wilayas.
Uses matplotlib with proper styling per charts skill guidelines.
"""

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import Patch
import numpy as np
import os

# ============================================================
# FONT CONFIGURATION (Chinese + Latin support)
# ============================================================
import os

# Try to add Chinese font if available
_font_paths = [
    '/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
]

for _font_path in _font_paths:
    if os.path.exists(_font_path):
        try:
            fm.fontManager.addfont(_font_path)
            break
        except:
            continue

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Noto Sans', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# Color palette (Business Cool from charts skill)
COLORS = {
    'primary': '#243447',
    'accent': '#4C6EF5',
    'bg': '#F8FAFC',
    'grid': '#E9EEF3',
    'text': '#37352F',
    'muted': '#94A3B8',
    'success': '#10B981',
    'warning': '#D97706',
    'danger': '#EF4444'
}

# Regional colors (distinct but harmonious)
REGION_COLORS = {
    'North (Coastal)': '#3B82F6',
    'North Inland': '#60A5FA',
    'Highlands': '#34D399',
    'Sahara': '#F59E0B',
    'Sahara Edge (Ziban)': '#FBBF24',
    'Deep Sahara (Hoggar)': '#F97316',
    'Southwest (Saoura/Sahara)': '#FB923C'
}

# ============================================================
# COMPLETE WILAYAS DATA (Same as Excel compilation)
# ============================================================

ALL_WILAYAS = [
    {"code": 1, "name_arabic": "أدرار", "name_french": "Adrar", "capital": "Adrar", "area_km2": 42739, "population": 197000, "districts": 6, "communes": 16, "coordinates": {"lat": 27.88056, "lng": -0.29722}, "region": "Sahara", "established": "1974"},
    {"code": 2, "name_arabic": "الشلف", "name_french": "Chlef", "capital": "Chlef", "area_km2": 4791, "population": 1356151, "districts": 13, "communes": 35, "coordinates": {"lat": 36.1667, "lng": 1.3333}, "region": "North (Coastal)", "established": "1968"},
    {"code": 3, "name_arabic": "الأغواط", "name_french": "Laghouat", "capital": "Laghouat", "area_km2": 25057, "population": 479200, "districts": 10, "communes": 24, "coordinates": {"lat": 33.45, "lng": 2.87}, "region": "Highlands (Steppe)", "established": "1957"},
    {"code": 4, "name_arabic": "أم البواقي", "name_french": "Oum El Bouaghi", "capital": "Oum El Bouaghi", "area_km2": 6094, "population": 558500, "districts": 12, "communes": 29, "coordinates": {"lat": 35.68, "lng": 7.12}, "region": "Highlands (Aurès)", "established": "1974"},
    {"code": 5, "name_arabic": "باتنة", "name_french": "Batna", "capital": "Batna", "area_km2": 12192, "population": 1128030, "districts": 21, "communes": 61, "coordinates": {"lat": 35.55, "lng": 6.17}, "region": "Highlands (Aurès)", "established": "1968"},
    {"code": 6, "name_arabic": "بجاية", "name_french": "Béjaïa", "capital": "Béjaïa", "area_km2": 3268, "population": 984050, "districts": 19, "communes": 52, "coordinates": {"lat": 36.75, "lng": 5.067}, "region": "North (Kabylie)", "established": "1974"},
    {"code": 7, "name_arabic": "بسكرة", "name_french": "Biskra", "capital": "Biskra", "area_km2": 9576, "population": 869215, "districts": 11, "communes": 27, "coordinates": {"lat": 34.867, "lng": 5.75}, "region": "Sahara Edge (Ziban)", "established": "1957"},
    {"code": 8, "name_arabic": "بشار", "name_french": "Béchar", "capital": "Béchar", "area_km2": 50400, "population": 315600, "districts": 13, "communes": 31, "coordinates": {"lat": 31.63, "lng": -2.23}, "region": "Southwest (Saoura/Sahara)", "established": "1974"},
    {"code": 9, "name_arabic": "البليدة", "name_french": "Blida", "capital": "Blida", "area_km2": 1696, "population": 1009000, "districts": 10, "communes": 25, "coordinates": {"lat": 36.48, "lng": 2.83}, "region": "North (Mitidja)", "established": "1968"},
    {"code": 10, "name_arabic": "البويرة", "name_french": "Bouira", "capital": "Bouira", "area_km2": 4435, "population": 704462, "districts": 12, "communes": 45, "coordinates": {"lat": 36.38, "lng": 3.90}, "region": "Highlands (Kabylie border)", "established": "1974"},
    {"code": 11, "name_arabic": "تمنراست", "name_french": "Tamanrasset", "capital": "Tamanrasset", "area_km2": 228419, "population": 191800, "districts": 6, "communes": 23, "coordinates": {"lat": 22.78, "lng": 5.52}, "region": "Deep Sahara (Hoggar)", "established": "1957"},
    {"code": 12, "name_arabic": "تبسة", "name_french": "Tébessa", "capital": "Tébessa", "area_km2": 13878, "population": 697100, "districts": 12, "communes": 28, "coordinates": {"lat": 35.41, "lng": 8.08}, "region": "Southeast (Highlands/Tunisian border)", "established": "1968"},
    {"code": 13, "name_arabic": "تلمسان", "name_french": "Tlemcen", "capital": "Tlemcen", "area_km2": 9061, "population": 945525, "districts": 20, "communes": 54, "coordinates": {"lat": 34.88, "lng": -1.32}, "region": "North (Coastal)", "established": "1968"},
    {"code": 14, "name_arabic": "تيارت", "name_french": "Tiaret", "capital": "Tiaret", "area_km2": 20673, "population": 842063, "districts": 14, "communes": 42, "coordinates": {"lat": 35.37, "lng": 1.32}, "region": "Highlands", "established": "1968"},
    {"code": 15, "name_arabic": "تيزي وزو", "name_french": "Tizi Ouzou", "capital": "Tizi Ouzou", "area_km2": 2993, "population": 1119646, "districts": 21, "communes": 67, "coordinates": {"lat": 36.72, "lng": 4.06}, "region": "North (Kabylie)", "established": "1968"},
    {"code": 16, "name_arabic": "الجزائر", "name_french": "Algiers", "capital": "Algiers", "area_km2": 1190, "population": 7796923, "districts": 13, "communes": 57, "coordinates": {"lat": 36.75, "lng": 3.05}, "region": "North (Coastal/Capital)", "established": "1968"},
    {"code": 17, "name_arabic": "الجلفة", "name_french": "Djelfa", "capital": "Djelfa", "area_km2": 66415, "population": 1223223, "districts": 12, "communes": 36, "coordinates": {"lat": 34.67, "lng": 3.38}, "region": "Highlands (Steppe)", "established": "1974"},
    {"code": 18, "name_arabic": "جيجل", "name_french": "Jijel", "capital": "Jijel", "area_km2": 2577, "population": 634412, "districts": 11, "communes": 28, "coordinates": {"lat": 36.80, "lng": 5.76}, "region": "North (Coastal)", "established": "1974"},
    {"code": 19, "name_arabic": "سطيف", "name_french": "Sétif", "capital": "Sétif", "area_km2": 6504, "population": 1496150, "districts": 20, "communes": 60, "coordinates": {"lat": 36.19, "lng": 5.41}, "region": "Highlands (East)", "established": "1968"},
    {"code": 20, "name_arabic": "سعيدة", "name_french": "Saïda", "capital": "Saïda", "area_km2": 6764, "population": 328685, "districts": 6, "communes": 16, "coordinates": {"lat": 34.83, "lng": 0.15}, "region": "Highlands", "established": "1968"},
    {"code": 21, "name_arabic": "سكيكدة", "name_french": "Skikda", "capital": "Skikda", "area_km2": 4026, "population": 1109355, "districts": 13, "communes": 38, "coordinates": {"lat": 36.87, "lng": 6.91}, "region": "North (Coastal)", "established": "1974"},
    {"code": 22, "name_arabic": "سيدي بلعباس", "name_french": "Sidi Bel Abbès", "capital": "Sidi Bel Abbès", "area_km2": 9151, "population": 603369, "districts": 15, "communes": 52, "coordinates": {"lat": 34.85, "lng": -0.60}, "region": "North (Inland)", "established": "1968"},
    {"code": 23, "name_arabic": "عنابة", "name_french": "Annaba", "capital": "Annaba", "area_km2": 1439, "population": 640050, "districts": 6, "communes": 12, "coordinates": {"lat": 36.93, "lng": 7.77}, "region": "North (Coastal)", "established": "1968"},
    {"code": 24, "name_arabic": "قالمة", "name_french": "Guelma", "capital": "Guelma", "area_km2": 4101, "population": 482261, "districts": 10, "communes": 34, "coordinates": {"lat": 36.46, "lng": 7.43}, "region": "North East", "established": "1974"},
    {"code": 25, "name_arabic": "قسنطينة", "name_french": "Constantine", "capital": "Constantine", "area_km2": 2187, "population": 1012643, "districts": 6, "communes": 12, "coordinates": {"lat": 36.37, "lng": 6.62}, "region": "Highlands (East)", "established": "1968"},
    {"code": 26, "name_arabic": "المدية", "name_french": "Médéa", "capital": "Médéa", "area_km2": 8866, "population": 830943, "districts": 19, "communes": 64, "coordinates": {"lat": 36.27, "lng": 2.75}, "region": "Highlands (Tell Atlas)", "established": "1968"},
    {"code": 27, "name_arabic": "مستغانم", "name_french": "Mostaganem", "capital": "Mostaganem", "area_km2": 2269, "population": 746947, "districts": 10, "communes": 32, "coordinates": {"lat": 35.933, "lng": 0.083}, "region": "North (Coastal)", "established": "1984"},
    {"code": 28, "name_arabic": "المسيلة", "name_french": "M'Sila", "capital": "M'Sila", "area_km2": 18718, "population": 991846, "districts": 15, "communes": 47, "coordinates": {"lat": 35.71, "lng": 4.53}, "region": "Highlands", "established": "1984"},
    {"code": 29, "name_arabic": "معسكر", "name_french": "Mascara", "capital": "Mascara", "area_km2": 5941, "population": 784073, "districts": 16, "communes": 43, "coordinates": {"lat": 35.40, "lng": 0.15}, "region": "North Inland", "established": "1984"},
    {"code": 30, "name_arabic": "ورقلة", "name_french": "Ouargla", "capital": "Ouargla", "area_km2": 211980, "population": 558558, "districts": 10, "communes": 21, "coordinates": {"lat": 33.81, "lng": 5.32}, "region": "Sahara", "established": "1974"},
    {"code": 31, "name_arabic": "وهران", "name_french": "Oran", "capital": "Oran", "area_km2": 2121, "population": 1584607, "districts": 9, "communes": 26, "coordinates": {"lat": 35.69, "lng": -0.63}, "region": "North (Coastal)", "established": "1968"},
    {"code": 32, "name_arabic": "البيض", "name_french": "El Bayadh", "capital": "El Bayadh", "area_km2": 78870, "population": 262187, "districts": 8, "communes": 22, "coordinates": {"lat": 33.68, "lng": 0.97}, "region": "Highlands/Sahara fringe", "established": "1984"},
    {"code": 33, "name_arabic": "إيليزي", "name_french": "Illizi", "capital": "Illizi", "area_km2": 284618, "population": 54490, "districts": 3, "communes": 6, "coordinates": {"lat": 32.54, "lng": 8.28}, "region": "Sahara (Southeast)", "established": "1984"},
    {"code": 34, "name_arabic": "برج بوعريريج", "name_french": "Bordj Bou Arréridj", "capital": "Bordj Bou Arréridj", "area_km2": 4115, "population": 634396, "districts": 10, "communes": 34, "coordinates": {"lat": 36.07, "lng": 4.75}, "region": "North Inland", "established": "1984"},
    {"code": 35, "name_arabic": "بومرداس", "name_french": "Boumerdès", "capital": "Boumerdès", "area_km2": 1591, "population": 802083, "districts": 9, "communes": 32, "coordinates": {"lat": 36.77, "lng": 3.47}, "region": "North (Coastal)", "established": "1984"},
    {"code": 36, "name_arabic": "الطارف", "name_french": "El Tarf", "capital": "El Tarf", "area_km2": 3339, "population": 411783, "districts": 7, "communes": 24, "coordinates": {"lat": 36.75, "lng": 8.13}, "region": "North East (Coastal)", "established": "1984"},
    {"code": 37, "name_arabic": "تندوف", "name_french": "Tindouf", "capital": "Tindouf", "area_km2": 159000, "population": 49149, "districts": 1, "communes": 2, "coordinates": {"lat": 27.67, "lng": -8.13}, "region": "Sahara (Southwest)", "established": "1974"},
    {"code": 38, "name_arabic": "تيسمسيلت", "name_french": "Tissemsilt", "capital": "Tissemsilt", "area_km2": 3152, "population": 296366, "districts": 8, "communes": 22, "coordinates": {"lat": 35.61, "lng": 1.82}, "region": "North Inland", "established": "1984"},
    {"code": 39, "name_arabic": "الوادي", "name_french": "El Oued", "capital": "El Oued", "area_km2": 54573, "population": 673934, "districts": 12, "communes": 30, "coordinates": {"lat": 33.51, "lng": 6.87}, "region": "Sahara (Northeast)", "established": "1984"},
    {"code": 40, "name_arabic": "خنشلة", "name_french": "Khenchela", "capital": "Khenchela", "area_km2": 9811, "population": 386683, "districts": 8, "communes": 21, "coordinates": {"lat": 35.43, "lng": 7.15}, "region": "Aurès Mountains", "established": "1984"},
    {"code": 41, "name_arabic": "سوق أهراس", "name_french": "Souk Ahras", "capital": "Souk Ahras", "area_km2": 4541, "population": 440299, "districts": 10, "communes": 26, "coordinates": {"lat": 36.29, "lng": 7.96}, "region": "North East (Aurès)", "established": "1984"},
    {"code": 42, "name_arabic": "تيبازة", "name_french": "Tipaza", "capital": "Tipaza", "area_km2": 2166, "population": 617661, "districts": 10, "communes": 28, "coordinates": {"lat": 36.59, "lng": 2.53}, "region": "North (Coastal)", "established": "1984"},
    {"code": 43, "name_arabic": "ميلة", "name_french": "Mila", "capital": "Mila", "area_km2": 9375, "population": 768419, "districts": 13, "communes": 34, "coordinates": {"lat": 36.45, "lng": 6.27}, "region": "North East", "established": "1984"},
    {"code": 44, "name_arabic": "عين الدفلى", "name_french": "Aïn Defla", "capital": "Khemis Miliana", "area_km2": 4897, "population": 771890, "districts": 8, "communes": 36, "coordinates": {"lat": 36.26, "lng": 2.23}, "region": "North", "established": "1984"},
    {"code": 45, "name_arabic": "النعامة", "name_french": "Naâma", "capital": "Naâma", "area_km2": 29950, "population": 209470, "districts": 7, "communes": 12, "coordinates": {"lat": 33.27, "lng": -0.31}, "region": "Highlands (Western)", "established": "1984"},
    {"code": 46, "name_arabic": "عين تموشنت", "name_french": "Aïn Témouchent", "capital": "Aïn Témouchent", "area_km2": 2377, "population": 432353, "districts": 8, "communes": 28, "coordinates": {"lat": 35.31, "lng": -1.13}, "region": "North West", "established": "1984"},
    {"code": 47, "name_arabic": "غرداية", "name_french": "Ghardaïa", "capital": "Ghardaïa", "area_km2": 21224, "population": 391671, "districts": 9, "communes": 13, "coordinates": {"lat": 32.49, "lng": 3.67}, "region": "Sahara (M'Zab Valley)", "established": "1984"},
    {"code": 48, "name_arabic": "ريزان", "name_french": "Relizane", "capital": "Relizane", "area_km2": 4870, "population": 733060, "districts": 7, "communes": 38, "coordinates": {"lat": 35.94, "lng": 0.33}, "region": "North West", "established": "1984"},
    {"code": 49, "name_arabic": "المغير", "name_french": "El M'Ghair", "capital": "El M'Ghair", "area_km2": 8835, "population": 162267, "districts": 6, "communes": 12, "coordinates": {"lat": 33.41, "lng": 6.66}, "region": "Sahara", "established": "2019"},
    {"code": 50, "name_arabic": "المنيعة", "name_french": "El Meniaa", "capital": "El Meniaa", "area_km2": 62215, "population": 57276, "districts": 4, "communes": 8, "coordinates": {"lat": 30.57, "lng": 2.87}, "region": "Sahara", "established": "2019"},
    {"code": 51, "name_arabic": "أولاد جلال", "name_french": "Ouled Djellal", "capital": "Ouled Djellal", "area_km2": 11410, "population": 174219, "districts": 6, "communes": 12, "coordinates": {"lat": 35.81, "lng": 5.91}, "region": "Sahara (Highlands fringe)", "established": "2019"},
    {"code": 52, "name_arabic": "برج باجي مختار", "name_french": "Bordj Badji Mokhtar", "capital": "Bordj Badji Mokhtar", "area_km2": 120026, "population": 16437, "districts": 2, "communes": 4, "coordinates": {"lat": 21.94, "lng": -0.95}, "region": "Sahara (Deep South)", "established": "2019"},
    {"code": 53, "name_arabic": "بني عباس", "name_french": "Béni Abbès", "capital": "Béni Abbès", "area_km2": 101350, "population": 50163, "districts": 6, "communes": 10, "coordinates": {"lat": 30.13, "lng": -2.17}, "region": "Sahara (Saoura)", "established": "2019"},
    {"code": 54, "name_arabic": "تيميمون", "name_french": "Timimoun", "capital": "Timimoun", "area_km2": 65203, "population": 122019, "districts": 4, "communes": 10, "coordinates": {"lat": 29.29, "lng": 0.23}, "region": "Sahara (Gourara)", "established": "2019"},
    {"code": 55, "name_arabic": "تقرت", "name_french": "Touggourt", "capital": "Touggourt", "area_km2": 17428, "population": 247221, "districts": 4, "communes": 11, "coordinates": {"lat": 33.11, "lng": 6.07}, "region": "Sahara (Oued Righ)", "established": "2019"},
    {"code": 56, "name_arabic": "جانت", "name_french": "Djanet", "capital": "Djanet", "area_km2": 86185, "population": 17618, "districts": 2, "communes": 3, "coordinates": {"lat": 24.55, "lng": 9.48}, "region": "Sahara (Tassili)", "established": "2019"},
    {"code": 57, "name_arabic": "عين صالح", "name_french": "In Salah", "capital": "In Salah", "area_km2": 131220, "population": 50392, "districts": 2, "communes": 3, "coordinates": {"lat": 27.25, "lng": 2.47}, "region": "Sahara (Tidikelt)", "established": "2019"},
    {"code": 58, "name_arabic": "عين قزّام", "name_french": "In Guezzam", "capital": "In Guezzam", "area_km2": 88126, "population": 11202, "districts": 2, "communes": 2, "coordinates": {"lat": 23.51, "lng": 5.74}, "region": "Sahara (Far South)", "established": "2019"}
]


def get_region_group(region):
    """Group detailed regions into broader categories."""
    if 'North' in region or 'Coastal' in region or 'Mitidja' in region or 'Kabylie' in region:
        return 'Northern Region'
    elif 'Highlands' in region or 'Aurès' in region or 'Steppe' in region:
        return 'Highlands Region'
    else:
        return 'Sahara Region'


# ============================================================
# CHART 1: TOP 15 MOST POPULOUS WILAYAS (Horizontal Bar)
# ============================================================

def create_population_chart():
    """Create horizontal bar chart of top 15 most populous wilayas."""
    
    # Sort by population descending and take top 15
    sorted_wilayas = sorted(ALL_WILAYAS, key=lambda x: x['population'], reverse=True)[:15]
    
    names = [w['name_french'] for w in sorted_wilayas]
    populations = [w['population'] / 1000000 for w in sorted_wilayas]  # Convert to millions
    
    fig, ax = plt.subplots(figsize=(14, 10), constrained_layout=True)
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['bg'])
    
    # Create color gradient based on rank
    colors = plt.cm.Blues(np.linspace(0.4, 0.9, len(names)))[::-1]
    
    bars = ax.barh(range(len(names)), populations, color=colors, edgecolor='white', linewidth=0.5)
    
    # Customize axes
    ax.set_yticks(range(len(names)))
    ax.set_yticklabels(names, fontsize=11, fontweight='medium')
    ax.invert_yaxis()  # Largest at top
    
    # Labels and title
    ax.set_xlabel('Population (Millions)', fontsize=12, fontweight='bold', color=COLORS['text'])
    ax.set_title('Top 15 Most Populous Algerian Wilayas\n(Administrative Provinces)', 
                 fontsize=16, fontweight='bold', color=COLORS['primary'], pad=20)
    
    # Add value labels on bars
    for i, (bar, pop) in enumerate(zip(bars, populations)):
        ax.text(bar.get_width() + 0.05, bar.get_y() + bar.get_height()/2,
                f'{pop:.2f}M', va='center', fontsize=10, color=COLORS['text'])
    
    # Grid styling
    ax.xaxis.grid(True, linestyle='--', alpha=0.3, color=COLORS['muted'])
    ax.set_axisbelow(True)
    
    # Remove spines
    for spine in ['top', 'right']:
        ax.spines[spine].set_visible(False)
    ax.spines['left'].set_color(COLORS['grid'])
    ax.spines['bottom'].set_color(COLORS['grid'])
    
    # Highlight Algiers (the capital)
    algiers_idx = next(i for i, w in enumerate(sorted_wilayas) if w['code'] == 16)
    bars[algiers_idx].set_color(COLORS['accent'])
    bars[algiers_idx].set_edgecolor(COLORS['primary'])
    bars[algiers_idx].set_linewidth(2)
    
    # Add annotation for capital
    ax.annotate('★ Capital', 
                xy=(populations[algiers_idx], algiers_idx),
                xytext=(populations[algiers_idx] + 0.5, algiers_idx),
                fontsize=9, color=COLORS['accent'], fontweight='bold')
    
    plt.savefig('/home/z/my-project/download/chart_01_top15_population.png', 
                dpi=300, bbox_inches='tight', facecolor=COLORS['bg'])
    plt.close()
    print("✅ Chart 1: Population ranking saved")


# ============================================================
# CHART 2: POPULATION BY REGION (Pie Chart)
# ============================================================

def create_region_pie_chart():
    """Create pie chart showing population distribution by broad region."""
    
    regions = {}
    for w in ALL_WILAYAS:
        region = get_region_group(w['region'])
        regions[region] = regions.get(region, 0) + w['population']
    
    # Sort by value
    sorted_regions = dict(sorted(regions.items(), key=lambda x: x[1], reverse=True))
    
    labels = list(sorted_regions.keys())
    sizes = list(sorted_regions.values())
    
    # Colors for each region
    pie_colors = ['#3B82F6', '#34D399', '#F59E0B']  # Blue, Green, Amber
    
    fig, ax = plt.subplots(figsize=(10, 10), constrained_layout=True)
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['bg'])
    
    wedges, texts, autotexts = ax.pie(
        sizes, 
        labels=None,
        autopct='%1.1f%%',
        startangle=90,
        colors=pie_colors,
        explode=(0.02, 0.02, 0.02),
        shadow=False,
        wedgeprops={'edgecolor': 'white', 'linewidth': 2}
    )
    
    # Style the percentage text
    for autotext in autotexts:
        autotext.set_fontsize(12)
        autotext.set_fontweight('bold')
        autotext.set_color('white')
    
    # Title
    ax.set_title('Algeria Population Distribution\nby Geographic Region', 
                 fontsize=16, fontweight='bold', color=COLORS['primary'], pad=20)
    
    # Legend outside
    legend_labels = [f'{label}: {size:,} ({size/sum(sizes)*100:.1f}%)' 
                     for label, size in zip(labels, sizes)]
    ax.legend(wedges, legend_labels, title="Regions",
              loc="center left", bbox_to_anchor=(1, 0, 0.5, 1),
              fontsize=11, title_fontsize=12)
    
    plt.savefig('/home/z/my-project/download/chart_02_region_distribution.png', 
                dpi=300, bbox_inches='tight', facecolor=COLORS['bg'])
    plt.close()
    print("✅ Chart 2: Regional distribution saved")


# ============================================================
# CHART 3: LARGEST WILAYAS BY AREA (Bar Chart)
# ============================================================

def create_area_chart():
    """Create bar chart showing largest wilayas by area."""
    
    # Sort by area descending and take top 12
    sorted_wilayas = sorted(ALL_WILAYAS, key=lambda x: x['area_km2'], reverse=True)[:12]
    
    names = [w['name_french'] for w in sorted_wilayas]
    areas = [w['area_km2'] / 1000 for w in sorted_wilayas]  # Convert to thousands km²
    
    fig, ax = plt.subplots(figsize=(14, 9), constrained_layout=True)
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['bg'])
    
    # Create gradient colors (warm tones for desert/sahara regions)
    colors = ['#DC2626' if 'Sahara' in w['region'] else '#F59E0B' if 'Highlands' in w['region'] else '#3B82F6' 
              for w in sorted_wilayas]
    
    bars = ax.bar(range(len(names)), areas, color=colors, edgecolor='white', linewidth=0.5)
    
    # Customize
    ax.set_xticks(range(len(names)))
    ax.set_xticklabels(names, rotation=45, ha='right', fontsize=10, fontweight='medium')
    
    ax.set_ylabel('Area (Thousands km²)', fontsize=12, fontweight='bold', color=COLORS['text'])
    ax.set_title('Largest Algerian Wilayas by Land Area\n(Top 12 Provinces)', 
                 fontsize=16, fontweight='bold', color=COLORS['primary'], pad=20)
    
    # Value labels
    for bar, area in zip(bars, areas):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'{area:.0f}K', ha='center', va='bottom', fontsize=9, color=COLORS['text'])
    
    # Grid
    ax.yaxis.grid(True, linestyle='--', alpha=0.3, color=COLORS['muted'])
    ax.set_axisbelow(True)
    
    # Spines
    for spine in ['top', 'right']:
        ax.spines[spine].set_visible(False)
    ax.spines['left'].set_color(COLORS['grid'])
    ax.spines['bottom'].set_color(COLORS['grid'])
    
    # Custom legend
    legend_elements = [
        Patch(facecolor='#DC2626', edgecolor='white', label='Sahara'),
        Patch(facecolor='#F59E0B', edgecolor='white', label='Highlands'),
        Patch(facecolor='#3B82F6', edgecolor='white', label='Northern')
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)
    
    plt.savefig('/home/z/my-project/download/chart_03_largest_area.png', 
                dpi=300, bbox_inches='tight', facecolor=COLORS['bg'])
    plt.close()
    print("✅ Chart 3: Area comparison saved")


# ============================================================
# CHART 4: ESTABLISHMENT TIMELINE (Stacked Bar)
# ============================================================

def create_timeline_chart():
    """Create stacked bar chart showing establishment timeline."""
    
    years_data = {}
    for w in ALL_WILAYAS:
        year = w.get('established', 'Unknown')
        region = get_region_group(w['region'])
        
        if year not in years_data:
            years_data[year] = {'Northern Region': 0, 'Highlands Region': 0, 'Sahara Region': 0}
        years_data[year][region] += 1
    
    # Sort by year
    sorted_years = sorted(years_data.items(), key=lambda x: x[0])
    year_labels = [y[0] for y in sorted_years]
    
    northern = [years_data[y]['Northern Region'] for y in year_labels]
    highlands = [years_data[y]['Highlands Region'] for y in year_labels]
    sahara = [years_data[y]['Sahara Region'] for y in year_labels]
    
    fig, ax = plt.subplots(figsize=(12, 8), constrained_layout=True)
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['bg'])
    
    x = np.arange(len(year_labels))
    width = 0.65
    
    # Stacked bars
    p1 = ax.bar(x, northern, width, label='Northern Region', color='#3B82F6', edgecolor='white')
    p2 = ax.bar(x, highlands, width, bottom=northern, label='Highlands Region', color='#34D399', edgecolor='white')
    p3 = ax.bar(x, sahara, width, bottom=[n+h for n,h in zip(northern, highlands)], 
                label='Sahara Region', color='#F59E0B', edgecolor='white')
    
    # Customize
    ax.set_xlabel('Year Established', fontsize=12, fontweight='bold', color=COLORS['text'])
    ax.set_ylabel('Number of Wilayas Created', fontsize=12, fontweight='bold', color=COLORS['text'])
    ax.set_title('Algeria Administrative Evolution\nWilaya Creation Timeline by Region', 
                 fontsize=16, fontweight='bold', color=COLORS['primary'], pad=20)
    
    ax.set_xticks(x)
    ax.set_xticklabels(year_labels, fontsize=11, fontweight='medium')
    
    # Add total count on top of each bar
    totals = [n+h+s for n,h,s in zip(northern, highlands, sahara)]
    for i, total in enumerate(totals):
        ax.text(i, total + 0.3, str(total), ha='center', fontsize=11, fontweight='bold', color=COLORS['text'])
    
    # Legend
    ax.legend(loc='upper left', fontsize=10, frameon=True, fancybox=True, shadow=False)
    
    # Grid & Spines
    ax.yaxis.grid(True, linestyle='--', alpha=0.3, color=COLORS['muted'])
    ax.set_axisbelow(True)
    for spine in ['top', 'right']:
        ax.spines[spine].set_visible(False)
    
    # Set y-axis limit to accommodate labels
    ax.set_ylim(0, max(totals) * 1.15)
    
    plt.savefig('/home/z/my-project/download/chart_04_establishment_timeline.png', 
                dpi=300, bbox_inches='tight', facecolor=COLORS['bg'])
    plt.close()
    print("✅ Chart 4: Establishment timeline saved")


# ============================================================
# CHART 5: POPULATION DENSITY SCATTER PLOT
# ============================================================

def create_density_scatter():
    """Create scatter plot showing population density vs area."""
    
    areas = [w['area_km2'] for w in ALL_WILAYAS]
    populations = [w['population'] for w in ALL_WILAYAS]
    densities = [p/a * 1000 for p,a in zip(populations, areas)]  # people per 1000 km²
    names = [w['name_french'] for w in ALL_WILAYAS]
    regions = [get_region_group(w['region']) for w in ALL_WILAYAS]
    
    # Color mapping by region
    region_colors = {
        'Northern Region': '#3B82F6',
        'Highlands Region': '#34D399',
        'Sahara Region': '#F59E0B'
    }
    colors = [region_colors[r] for r in regions]
    
    fig, ax = plt.subplots(figsize=(14, 10), constrained_layout=True)
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['bg'])
    
    scatter = ax.scatter(areas, populations, c=colors, s=densities, alpha=0.6, 
                         edgecolors='white', linewidth=0.5)
    
    # Label notable points
    notable_codes = [16, 31, 11, 58]  # Algiers, Oran, Tamanrasset, In Guezzam
    for code in notable_codes:
        w = next(x for x in ALL_WILAYAS if x['code'] == code)
        ax.annotate(w['name_french'],
                    xy=(w['area_km2'], w['population']),
                    xytext=(10, 10), textcoords='offset points',
                    fontsize=9, fontweight='bold',
                    arrowprops=dict(arrowstyle='->', color=COLORS['muted'], lw=0.8))
    
    # Log scale for better visualization
    ax.set_xscale('log')
    ax.set_yscale('log')
    
    ax.set_xlabel('Area (km²) — Log Scale', fontsize=12, fontweight='bold', color=COLORS['text'])
    ax.set_ylabel('Population — Log Scale', fontsize=12, fontweight='bold', color=COLORS['text'])
    ax.set_title('Algeria Wilayas: Population vs Area\n(Bubble Size = Population Density)', 
                 fontsize=16, fontweight='bold', color=COLORS['primary'], pad=20)
    
    # Grid
    ax.grid(True, linestyle='--', alpha=0.3, color=COLORS['muted'], which='both')
    
    # Spines
    for spine in ['top', 'right']:
        ax.spines[spine].set_visible(False)
    
    # Legend
    legend_elements = [
        Patch(facecolor='#3B82F6', edgecolor='white', label='Northern Region'),
        Patch(facecolor='#34D399', edgecolor='white', label='Highlands Region'),
        Patch(facecolor='#F59E0B', edgecolor='white', label='Sahara Region')
    ]
    ax.legend(handles=legend_elements, loc='upper left', fontsize=10)
    
    plt.savefig('/home/z/my-project/download/chart_05_density_scatter.png', 
                dpi=300, bbox_inches='tight', facecolor=COLORS['bg'])
    plt.close()
    print("✅ Chart 5: Density scatter plot saved")


# ============================================================
# MAIN EXECUTION
# ============================================================

def main():
    """Generate all visualizations."""
    
    print("=" * 60)
    print("ALGERIA WILAYAS VISUALIZATION SUITE")
    print("=" * 60)
    print("\nGenerating professional charts...\n")
    
    # Ensure output directory exists
    os.makedirs('/home/z/my-project/download', exist_ok=True)
    
    # Generate all charts
    create_population_chart()
    create_region_pie_chart()
    create_area_chart()
    create_timeline_chart()
    create_density_scatter()
    
    print("\n" + "=" * 60)
    print("✅ All 5 visualizations generated successfully!")
    print("=" * 60)
    print("\n📁 Output location: /home/z/my-project/download/")
    print("\n📊 Charts created:")
    print("   1. chart_01_top15_population.png - Top 15 populous wilayas")
    print("   2. chart_02_region_distribution.png - Population by region")
    print("   3. chart_03_largest_area.png - Largest provinces by area")
    print("   4. chart_04_establishment_timeline.png - Administrative evolution")
    print("   5. chart_05_density_scatter.png - Population density analysis")


if __name__ == "__main__":
    main()
