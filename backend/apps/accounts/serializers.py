from rest_framework import serializers, views, response, permissions
from .models import UserProfile
from apps.facilities.serializers import FacilitySerializer

class UserProfileSerializer(serializers.ModelSerializer):
    facility = FacilitySerializer(read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['firebase_uid', 'name', 'email', 'role', 'facility', 'is_active', 'created_at']

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return response.Response({'detail': 'User profile not found'}, status=404)
        serializer = UserProfileSerializer(profile)
        return response.Response(serializer.data)
