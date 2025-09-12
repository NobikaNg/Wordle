from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Player, GameRoom
from rest_framework_simplejwt.tokens import RefreshToken
import random
import logging
from django.conf import settings

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny] 
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or len(username) < 3:
            return Response({'error': 'Username must be at least 3 characters'}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 5:
            return Response({'error': 'Password must be at least 5 characters'}, status=status.HTTP_400_BAD_REQUEST)

        if Player.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        player = Player.objects.create_user(username=username, password=password)

        refresh = RefreshToken.for_user(player)

        return Response({
            'username': player.username,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class CreateRoomView(APIView):
    permission_classes = [permissions.IsAuthenticated] 

    def post(self, request):
        logging.info(f"CreateRoomView headers: {request.headers}")
        try:
            word_list = settings.GAME_CONFIG.get('word_list', ['error'])
            if not word_list or word_list == ['error']:
                raise ValueError("Word list is empty or missing in config")
            
            ans_word = random.choice(word_list)
            max_turns = settings.GAME_CONFIG.get('max_turns', 6)

            room = GameRoom.objects.create(
                answer_word=ans_word,
                max_turns=max_turns,
                players=[request.user.username], 
                game_mode='multiplayer'
            )
            
            logging.info(f"New game room {room.room_id} created by {request.user.username}. Answer: {ans_word}")

            return Response({'room_id': room.room_id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logging.error(f'Error creating game room: {e}')
            return Response({'error': 'Failed to create game room'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ListRoomsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        rooms = GameRoom.objects.filter(game_mode='multiplayer')
        
        data = []
        for room in rooms:
            data.append({
                'room_id': room.room_id,
                'players_count': len(room.players),
                'is_full': room.is_full(),
                'host': room.host,
                # --- 新增：回傳遊戲狀態 ---
                'game_state': room.game_state,
            })
        return Response(data)