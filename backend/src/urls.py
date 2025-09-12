from django.urls import path
from . import views, single_player
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    #multiplayer
    path('create_room/', views.CreateRoomView.as_view(), name='create_room'),
    path('list_rooms/', views.ListRoomsView.as_view(), name='list_rooms'),

    # single player
    path('single_player/start/', single_player.StartSinglePlayerGameView.as_view(), name='start_single_player'),
    path('single_player/guess/<uuid:room_id>/', single_player.SinglePlayerGuessView.as_view(), name='guess_single_player'),
    path('single_player/replay/<uuid:room_id>/', single_player.ReplaySinglePlayerGameView.as_view(), name='replay_single_player'),
    
]