from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TweetViewSet, RegisterView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tweets', TweetViewSet, basename='tweet')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
