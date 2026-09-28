from rest_framework import views, response, permissions
from .serializers import UserProfileSerializer

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return response.Response({'detail': 'User profile not found'}, status=404)
        serializer = UserProfileSerializer(profile)
        return response.Response(serializer.data)
