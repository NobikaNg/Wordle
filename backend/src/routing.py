from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/wordle/(?P<room_id>[^/]+)/$', consumers.WordleConsumer.as_asgi()),
]