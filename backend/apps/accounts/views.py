from rest_framework import views, response, permissions
from .serializers import UserProfileSerializer
from apps.facilities.models import Facility

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return response.Response({'detail': 'User profile not found'}, status=404)
        serializer = UserProfileSerializer(profile)
        return response.Response(serializer.data)

    def patch(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return response.Response({'detail': 'User profile not found'}, status=404)

        name = request.data.get('name')
        role = request.data.get('role')
        facility_id = request.data.get('facility_id')

        if name:
            profile.name = name
        if role in ['HOSPITAL', 'HOSPITAL_APPROVAL', 'HOSPITAL_LOGISTICS', 'BLOOD_BANK']:
            profile.role = role
        if facility_id:
            fac = Facility.objects.filter(facility_id=facility_id).first()
            if fac:
                profile.facility = fac

        profile.save()
        serializer = UserProfileSerializer(profile)
        return response.Response(serializer.data)
