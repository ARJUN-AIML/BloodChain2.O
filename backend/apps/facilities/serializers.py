from rest_framework import serializers
from .models import Facility

DISTRICT_COORDINATES = {
    'Ariyalur': (11.1399, 79.0768),
    'Chengalpattu': (12.6841, 79.9836),
    'Chennai': (13.0827, 80.2707),
    'Coimbatore': (11.0168, 76.9558),
    'Dharmapuri': (12.1357, 78.1584),
    'Dindigul': (10.3673, 77.9803),
    'Erode': (11.3410, 77.7172),
    'Kanyakumari': (8.0883, 77.5385),
    'Karur': (10.9601, 78.0766),
    'Krishnagiri': (12.5186, 78.2137),
    'Madurai': (9.9252, 78.1198),
    'Namakkal': (11.2189, 78.1674),
    'Pudukkottai': (10.3797, 78.8208),
    'Ramanathapuram': (9.3639, 78.8395),
    'Salem': (11.6643, 78.1460),
    'Sivaganga': (9.8433, 78.4809),
    'Thanjavur': (10.7870, 79.1378),
    'Theni': (10.0104, 77.4768),
    'Thoothukudi': (8.7642, 78.1348),
    'Tiruchirappalli': (10.7905, 78.7047),
    'Tirunelveli': (8.7139, 77.7567),
    'Tiruvannamalai': (12.2253, 79.0747),
    'Tiruvarur': (10.7725, 79.6365),
    'Vellore': (12.9165, 79.1325),
}

FACILITY_COORDINATES = {
    # Chennai
    'ch_h_01': (13.0805, 80.2778),
    'ch_h_02': (13.1075, 80.2872),
    'ch_h_03': (13.0784, 80.2435),
    'ch_h_04': (13.0694, 80.2725),
    'ch_h_05': (13.0604, 80.2496),
    'ch_h_06': (13.0234, 80.1856),
    'ch_b_01': (13.0732, 80.2609),
    'ch_b_02': (13.0878, 80.2785),
    'ch_b_03': (13.0520, 80.2520),
    'ch_b_04': (12.9863, 80.2431),
    'ch_b_05': (13.0712, 80.2411),
    'ch_b_06': (13.0635, 80.2642),
    # Coimbatore
    'co_h_01': (11.0016, 76.9696),
    'co_h_02': (11.0210, 76.9890),
    'co_b_01': (11.0025, 76.9710),
    # Madurai
    'ma_h_01': (9.9252, 78.1255),
    'ma_b_01': (9.9230, 78.1180),
    'ma_b_02': (9.9265, 78.1270),
    # Salem
    'sa_h_01': (11.6540, 78.1560),
    'sa_b_01': (11.6620, 78.1480),
    'sa_b_02': (11.6580, 78.1510),
    'sa_b_03': (11.6660, 78.1420),
    'sa_b_04': (11.6555, 78.1575),
    # Tiruchirappalli
    'tr_h_01': (10.8050, 78.6920),
    'tr_h_02': (10.8120, 78.6850),
    'tr_b_01': (10.8140, 78.6870),
    # Tirunelveli
    'ti_h_01': (8.7180, 77.7490),
    'ti_b_01': (8.7195, 77.7510),
    # Thanjavur
    'th_h_01': (10.7720, 79.1250),
    'th_b_01': (10.7850, 79.1350),
    'th_b_02': (10.7735, 79.1265),
    # Vellore
    've_h_01': (12.9249, 79.1350),
    've_b_01': (12.9260, 79.1365),
    # Dindigul
    'di_h_01': (10.3673, 77.9803),
    'di_b_01': (10.3690, 77.9820),
    # Single Facility Districts
    'ar_h_01': (11.1399, 79.0768),
    'ce_h_01': (12.6841, 79.9836),
    'dh_h_01': (12.1357, 78.1584),
    'er_b_01': (11.3410, 77.7172),
    'ky_h_01': (8.0883, 77.5385),
    'ka_h_01': (10.9601, 78.0766),
    'kg_h_01': (12.5186, 78.2137),
    'na_h_01': (11.2189, 78.1674),
    'pu_h_01': (10.3797, 78.8208),
    'ra_h_01': (9.3639, 78.8395),
    'si_h_01': (9.8433, 78.4809),
    'tn_h_01': (10.0104, 77.4768),
    'to_h_01': (8.7642, 78.1348),
    'tv_h_01': (12.2253, 79.0747),
    'tu_h_01': (10.7725, 79.6365),
}

class FacilitySerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    active_camps_count = serializers.SerializerMethodField()

    class Meta:
        model = Facility
        fields = [
            'facility_id', 'name', 'facility_type', 'district',
            'address', 'is_active', 'latitude', 'longitude', 'active_camps_count'
        ]

    def get_latitude(self, obj):
        coords = FACILITY_COORDINATES.get(obj.facility_id) or DISTRICT_COORDINATES.get(obj.district, (13.0827, 80.2707))
        return coords[0]

    def get_longitude(self, obj):
        coords = FACILITY_COORDINATES.get(obj.facility_id) or DISTRICT_COORDINATES.get(obj.district, (13.0827, 80.2707))
        return coords[1]

    def get_active_camps_count(self, obj):
        try:
            return obj.organized_camps.filter(status__in=['UPCOMING', 'ACTIVE']).count()
        except Exception:
            return 0

